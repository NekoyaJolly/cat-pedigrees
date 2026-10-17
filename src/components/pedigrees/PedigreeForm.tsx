'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { Pedigree } from '@prisma/client';
import { usePedigreeStore } from '@/store/usePedigreeStore';
import { FormInput } from './FormInput';
import { getDuplicateIdentifiers } from '@/utils/duplicateChecker';
import { getPedigreeByKey, savePedigree } from '@/actions/pedigreeActions';
import { generateCatCompositeId } from '@/utils/idGenerator';
import { ancestryOf, siblingDraft, type TextField, type NumberField } from '@/lib/pedigree-fields';

export interface MasterOption { code: number; name: string }
export interface PedigreeMasters { breeds: MasterOption[]; colors: MasterOption[]; genders: MasterOption[] }
type SaveMode = 'save' | 'print' | 'sibling';
type LookupRole = 'self' | 'shared' | 'father' | 'mother';
interface AncestorGroup { title: string; side: 'father' | 'mother'; fields: readonly (readonly [TextField, string])[] }

// 入力順はAccessの本猫情報と3世代の並びを引き継ぐ。
const generations: readonly AncestorGroup[][] = [
  [
    { title: '父', side: 'father', fields: [['fatherTitle','称号'],['fatherCatName','名前'],['fatherEyeColor','目色'],['fatherCoatColor','色柄'],['fatherJCU','ナンバー']] },
    { title: '母', side: 'mother', fields: [['motherTitle','称号'],['motherCatName','名前'],['motherEyeColor','目色'],['motherCoatColor','色柄'],['motherJCU','ナンバー']] },
  ],
  [
    { title: '父の父', side: 'father', fields: [['ffTitle','称号'],['ffCatName','名前'],['ffCatColor','色柄'],['ffjcu','ナンバー']] },
    { title: '父の母', side: 'father', fields: [['fmTitle','称号'],['fmCatName','名前'],['fmCatColor','色柄'],['fmjcu','ナンバー']] },
    { title: '母の父', side: 'mother', fields: [['mfTitle','称号'],['mfCatName','名前'],['mfCatColor','色柄'],['mfjcu','ナンバー']] },
    { title: '母の母', side: 'mother', fields: [['mmTitle','称号'],['mmCatName','名前'],['mmCatColor','色柄'],['mmjcu','ナンバー']] },
  ],
  [
    { title: '父・父の父', side: 'father', fields: [['fffTitle','称号'],['fffCatName','名前'],['fffjcu','ナンバー']] },
    { title: '父・父の母', side: 'father', fields: [['ffmTitle','称号'],['ffmCatName','名前'],['ffmjcu','ナンバー']] },
    { title: '父・母の父', side: 'father', fields: [['fmfTitle','称号'],['fmfCatName','名前'],['fmfjcu','ナンバー']] },
    { title: '父・母の母', side: 'father', fields: [['fmmTitle','称号'],['fmmCatName','名前'],['fmmjcu','ナンバー']] },
    { title: '母・父の父', side: 'mother', fields: [['mffTitle','称号'],['mffCatName','名前'],['mffjcu','ナンバー']] },
    { title: '母・父の母', side: 'mother', fields: [['mfmTitle','称号'],['mfmCatName','名前'],['mfmjcu','ナンバー']] },
    { title: '母・母の父', side: 'mother', fields: [['mmfTitle','称号'],['mmfCatName','名前'],['mmfjcu','ナンバー']] },
    { title: '母・母の母', side: 'mother', fields: [['mmmTitle','称号'],['mmmCatName','名前'],['mmmjcu','ナンバー']] },
  ],
];

export default function PedigreeForm({ masters, canWrite }: { masters: PedigreeMasters; canWrite: boolean }) {
  const { formData, updateField, setFormData, mergeAncestryData } = usePedigreeStore();
  const duplicates = useMemo(() => getDuplicateIdentifiers(formData), [formData]);
  const [lookup, setLookup] = useState<Record<LookupRole, string>>({ self: '', shared: '', father: '', mother: '' });
  const [loading, setLoading] = useState<LookupRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<SaveMode>('save');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const requestId = useRef<string | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const changeText = (event: ChangeEvent<HTMLInputElement>, field: TextField) => {
    updateField(field, event.target.value); setDirty(true); setMessage('');
  };
  const changeNumber = (event: ChangeEvent<HTMLInputElement>, field: NumberField) => {
    updateField(field, event.target.value === '' ? null : Number(event.target.value)); setDirty(true); setMessage('');
  };

  async function fetchCat(role: LookupRole) {
    const key = lookup[role].trim();
    if (!key || loading) return;
    if (!/^\d{1,10}$/.test(key)) { setError('呼び出す猫の数字IDを入力してください。'); return; }
    if (dirty && role === 'self' && !window.confirm('入力中の内容を置き換えて、指定した猫を開きますか？')) return;
    setLoading(role); setError(''); setMessage('');
    try {
      const record = await getPedigreeByKey(key);
      if (!record) { setError('そのIDの猫が見つかりませんでした。'); return; }
      if (role === 'self') { setFormData(record); setDirty(false); setSavedId(null); requestId.current = null; window.history.replaceState(null,'','/pedigrees/' + record.id); }
      else if (role === 'shared') { setFormData({ ...formData, ...ancestryOf(record) }); setDirty(true); }
      else { mergeAncestryData(record, role); setDirty(true); }
      setMessage('指定した猫の情報を呼び出しました。');
    } catch { setError('猫の情報を呼び出せませんでした。通信を確認して、もう一度お試しください。'); }
    finally { setLoading(null); }
  }

  async function save() {
    if (saving || loading || !canWrite) return;
    const printWindow = mode !== 'save' ? window.open('about:blank', '_blank') : null;
    if (printWindow) printWindow.opener = null;
    setSaving(true); setError(''); setMessage('');
    requestId.current ??= crypto.randomUUID();
    try {
      const result = await savePedigree({ recordId: formData.id, expectedUpdatedAt: formData.updatedAt ? new Date(formData.updatedAt).toISOString() : undefined, requestId: requestId.current, draft: formData });
      if (!result.ok) { printWindow?.close(); setError(result.message); return; }
      const record = result.record;
      setSavedId(record.id); setDirty(false); requestId.current = null;
      if (printWindow) printWindow.location.href = '/pedigrees/' + record.id + '/print';
      if (mode === 'sibling') {
        setFormData(siblingDraft(record));
        window.history.replaceState(null,'','/pedigrees/new');
        setMessage('ID ' + record.pedigreeId + ' を保存しました。父母などを引き継いで、次の猫を登録できます。');
      } else {
        setFormData(record); window.history.replaceState(null,'','/pedigrees/' + record.id); setMessage('ID ' + record.pedigreeId + ' を保存しました。');
      }
    } catch { printWindow?.close(); setError('保存結果を確認できませんでした。入力内容を残しています。同じ画面からもう一度保存してください。'); }
    finally { setSaving(false); }
  }

  function newCat() {
    window.location.href = '/pedigrees/new';
  }

  const compositeId = formData.pedigreeId ? generateCatCompositeId(formData.breedCode, formData.coatColorCode, formData.genderCode, formData.pedigreeId) : '';
  const input = (field: TextField, label: string) => <FormInput key={field} label={label} value={formData[field] ?? ''} maxLength={field === 'notes' || field === 'notes2' ? 2000 : 500} onChange={event => changeText(event, field)} isDuplicate={duplicates.has(String(formData[field] ?? '').trim())} />;
  const master = (field: 'breedCode' | 'coatColorCode' | 'genderCode', label: string, values: MasterOption[]) => <div key={field}>
    <FormInput label={label} type="number" min="0" list={field + '-options'} value={formData[field] ?? ''} onChange={event => changeNumber(event, field)} />
    <datalist id={field + '-options'}>{values.map(value => <option key={value.code} value={value.code}>{value.name}</option>)}</datalist>
    <div className="border-b border-r border-gray-400 bg-white/50 px-2 py-1 text-xs text-gray-600">{values.find(value => value.code === formData[field])?.name || 'コードを選ぶと名称を表示します'}</div>
  </div>;

  return <div className="mx-auto w-full max-w-6xl bg-gray-100 p-3 text-sm md:p-4">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-lg font-bold">{formData.id ? '血統情報の編集' : '血統情報の新規登録'}</h1>
      <div className="flex flex-wrap items-center gap-2">
        {formData.id ? <a className="action-secondary" href={'/pedigrees/new?sibling=' + formData.id}>きょうだいを登録</a> : null}
        <button type="button" className="action-secondary" onClick={newCat} disabled={saving}>新しい猫</button>
        {formData.id ? <a className="action-secondary" href={'/pedigrees/' + formData.id + '/print'} target="_blank" rel="noreferrer">印刷</a> : null}
      </div>
    </div>
    <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
      {(['self','shared','father','mother'] as const).map(role => <div key={role}>
        <label className="mb-1 block text-xs font-medium" htmlFor={'lookup-' + role}>{({ self: '本猫を呼び出すID', shared: '両親ID', father: '父猫ID', mother: '母猫ID' })[role]}</label>
        <div className="flex gap-1">
          <input id={'lookup-' + role} className="w-full min-w-0 rounded border border-gray-400 bg-white px-2 py-2" inputMode="numeric" value={lookup[role]} disabled={saving || loading !== null} onChange={event => setLookup({ ...lookup, [role]: event.target.value })} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void fetchCat(role); } }} />
          <button type="button" className="action-secondary whitespace-nowrap" disabled={saving || loading !== null || !lookup[role]} onClick={() => void fetchCat(role)}>呼出</button>
        </div>
      </div>)}
    </div>
    {loading ? <p role="status" className="mb-3">猫の情報を呼び出しています…</p> : null}
    {error ? <p role="alert" className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-red-800">{error}</p> : null}
    {message ? <div role="status" className="mb-3 rounded border border-green-300 bg-green-50 p-3 text-green-900">{message} {savedId ? <a className="underline" href={'/pedigrees/' + savedId + '/print'} target="_blank" rel="noreferrer">印刷画面を開く</a> : null}</div> : null}
    {!canWrite ? <p className="mb-3 text-amber-800">現在は閲覧用です。</p> : null}
    <fieldset disabled={saving || loading !== null || !canWrite} className="min-w-0">
      <div className="mb-4 grid grid-cols-1 border-l border-t border-gray-400 bg-white md:grid-cols-3">
        <div>
          <div className="flex"><FormInput label="本猫ID" value={formData.pedigreeId || ''} placeholder="保存時に決まります" readOnly className="flex-1" />{master('genderCode','性別',masters.genders)}</div>
          {input('catName','名前')}{input('catName2','名前の続き')}
          {master('breedCode','猫種',masters.breeds)}{master('coatColorCode','色柄',masters.colors)}
        </div>
        <div>{input('birthDate','誕生日')}{input('eyeColor','目色')}{input('breederName','繁殖者')}{input('ownerName','所有者')}{input('registrationDate','登録日')}</div>
        <div>
          <div className="flex">{(['brotherCount','sisterCount'] as const).map((field,index) => <FormInput key={field} label={index === 0 ? '兄弟 M' : '姉妹 F'} type="number" min="0" value={formData[field] ?? ''} className="min-w-0 flex-1" onChange={event => changeNumber(event,field)} />)}</div>
          {input('title','称号')}{input('notes','摘要1')}{input('notes2','摘要2')}{input('otherNo','他団体No')}
          <FormInput label="本猫ナンバー" value={compositeId} readOnly />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-0">
        {generations.map((groups,index) => <section key={index} className="flex min-w-0 flex-col" aria-label={['父母','祖父母','曾祖父母'][index]}>
          <h2 className="bg-gray-200 px-2 py-1 text-xs font-bold">{['父母','祖父母','曾祖父母'][index]}</h2>
          <div className="flex flex-1 flex-col">
            {groups.map(group => <div key={group.title} className={'flex flex-1 flex-col justify-center border-l border-t border-gray-400 ' + (group.side === 'father' ? 'bg-blue-50' : 'bg-rose-50')}>
              <h3 className="border-b border-r border-gray-400 px-2 py-1 text-xs font-medium text-gray-600">{group.title}</h3>
              {group.fields.map(([field,label]) => <FormInput key={field} label={group.title + ' ' + label} value={formData[field] ?? ''} onChange={event => changeText(event,field)} isDuplicate={duplicates.has(String(formData[field] ?? '').trim())} maxLength={500} />)}
            </div>)}
          </div>
        </section>)}
      </div>
    </fieldset>
    <div className="sticky bottom-0 mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-gray-300 bg-gray-100 py-3">
      {dirty ? <span className="mr-auto text-xs text-gray-600">未保存の変更があります</span> : null}
      <label className="sr-only" htmlFor="save-mode">保存後の操作</label>
      <select id="save-mode" className="max-w-full rounded border border-gray-400 bg-white p-2" value={mode} disabled={saving} onChange={event => setMode(event.target.value as SaveMode)}>
        <option value="save">保存して内容を確認</option><option value="print">保存して印刷</option><option value="sibling">保存・印刷して、きょうだいを続ける</option>
      </select>
      <button type="button" className="action-primary" disabled={saving || loading !== null || !canWrite} onClick={() => void save()}>{saving ? '保存しています…' : '保存'}</button>
    </div>
  </div>;
}
