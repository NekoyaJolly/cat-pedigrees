'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { usePedigreeStore } from '@/store/usePedigreeStore';
import { FormInput } from './FormInput';
import PedigreeAncestry from './PedigreeAncestry';
import { useFormViewport } from './useFormViewport';
import { getDuplicateIdentifiers } from '@/utils/duplicateChecker';
import { getPedigreeByKey, savePedigree } from '@/actions/pedigreeActions';
import { generateCatCompositeId } from '@/utils/idGenerator';
import { ancestryOf, siblingDraft, type TextField, type NumberField } from '@/lib/pedigree-fields';

export interface MasterOption { code: number; name: string }
export interface PedigreeMasters { breeds: MasterOption[]; colors: MasterOption[]; genders: MasterOption[] }
type SaveMode = 'save' | 'print' | 'sibling';
type LookupRole = 'self' | 'shared' | 'father' | 'mother';

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
  const formRef = useRef<HTMLDivElement>(null);
  const savebarRef = useRef<HTMLDivElement>(null);
  useFormViewport(formRef, savebarRef);

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
  const master = (field: 'breedCode' | 'coatColorCode' | 'genderCode', label: string, values: MasterOption[]) => <div key={field} className={field === 'genderCode' ? 'w-28 min-w-0 max-w-[45%] sm:w-36' : 'min-w-0'}>
    <FormInput label={label} type="number" min="0" list={field + '-options'} value={formData[field] ?? ''} onChange={event => changeNumber(event, field)} />
    <datalist id={field + '-options'}>{values.map(value => <option key={value.code} value={value.code}>{value.name}</option>)}</datalist>
    <div className="break-words border-b border-r border-gray-400 bg-white/50 px-2 py-1 text-sm text-gray-700">{values.find(value => value.code === formData[field])?.name || 'コードを選ぶと名称を表示します'}</div>
  </div>;

  return <div ref={formRef} className="mx-auto w-full min-w-0 max-w-6xl rounded-lg border border-gray-300 bg-white p-3 text-base sm:p-4 lg:text-sm">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold">{formData.id ? '血統情報の編集' : '血統情報の新規登録'}</h1>
        {formData.id ? <p className="mt-1 break-words text-sm text-gray-700">ID {formData.pedigreeId}　{formData.catName}{formData.catName2 ? ' ' + formData.catName2 : ''}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {formData.id ? <a className="action-secondary" href={'/pedigrees/new?sibling=' + formData.id}>きょうだいを登録</a> : null}
        <button type="button" className="action-secondary" onClick={newCat} disabled={saving}>新しい猫</button>
        {formData.id ? <a className="action-secondary" href={'/pedigrees/' + formData.id + '/print'} target="_blank" rel="noreferrer">印刷</a> : null}
      </div>
    </div>
    <div className="pedigree-lookups mb-4 grid gap-3">
      {(['self','shared','father','mother'] as const).map(role => <div key={role} className="min-w-0">
        <label className="mb-1 block text-sm font-medium" htmlFor={'lookup-' + role}>{({ self: '本猫を呼び出すID', shared: '両親ID', father: '父猫ID', mother: '母猫ID' })[role]}</label>
        <div className="flex gap-1">
          <input id={'lookup-' + role} className="pedigree-lookup min-h-11 w-full min-w-0 rounded border border-gray-400 bg-white px-2 py-2 text-base lg:text-sm" inputMode="numeric" value={lookup[role]} disabled={saving || loading !== null} onChange={event => setLookup({ ...lookup, [role]: event.target.value })} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void fetchCat(role); } }} />
          <button type="button" className="action-secondary shrink-0 whitespace-nowrap px-2" aria-label={({ self: '本猫', shared: '両親', father: '父猫', mother: '母猫' })[role] + 'を呼び出す'} disabled={saving || loading !== null || !lookup[role]} onClick={() => void fetchCat(role)}>呼出</button>
        </div>
      </div>)}
    </div>
    {loading ? <p role="status" className="mb-3">猫の情報を呼び出しています…</p> : null}
    {!canWrite ? <p className="mb-3 text-amber-800">現在は閲覧用です。</p> : null}
    <nav aria-label="フォーム内の移動" className="mb-4 flex flex-wrap gap-2 lg:hidden">
      {([['cat-details','本猫'],['parents','父母'],['grandparents','祖父母'],['great-grandparents','曾祖父母']] as const).map(([id,label]) => <a key={id} className="action-secondary" href={'#' + id}>{label}</a>)}
    </nav>
    <section id="cat-details" className="mb-5 scroll-mt-4" aria-labelledby="cat-details-heading">
      <h2 id="cat-details-heading" className="bg-gray-200 px-3 py-2 text-base font-bold lg:px-2 lg:text-sm">本猫</h2>
      <fieldset disabled={saving || loading !== null || !canWrite} className="min-w-0">
      <div className="grid grid-cols-1 border-l border-t border-gray-400 bg-white md:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          <div className="flex"><FormInput label="本猫ID" value={formData.pedigreeId || ''} placeholder="保存時に決まります" readOnly className="flex-1" />{master('genderCode','性別',masters.genders)}</div>
          {input('catName','名前')}{input('catName2','名前の続き')}
          {master('breedCode','猫種',masters.breeds)}{master('coatColorCode','色柄',masters.colors)}
        </div>
        <div>{input('birthDate','誕生日')}{input('eyeColor','目色')}{input('breederName','繁殖者')}{input('ownerName','所有者')}{input('registrationDate','登録日')}</div>
        <div className="min-w-0 md:col-span-2 lg:col-span-1">
          <div className="flex">{(['brotherCount','sisterCount'] as const).map((field,index) => <FormInput key={field} label={index === 0 ? '兄弟 M' : '姉妹 F'} type="number" min="0" value={formData[field] ?? ''} className="min-w-0 flex-1" onChange={event => changeNumber(event,field)} />)}</div>
          {input('title','称号')}{input('notes','摘要1')}{input('notes2','摘要2')}{input('otherNo','他団体No')}
          <FormInput label="本猫ナンバー" value={compositeId} readOnly />
        </div>
      </div>
      </fieldset>
    </section>
    <PedigreeAncestry formData={formData} duplicates={duplicates} disabled={saving || loading !== null || !canWrite} onChange={changeText} />
    <div ref={savebarRef} className="pedigree-savebar sticky bottom-0 z-10 -mx-3 mt-4 border-t border-gray-300 bg-white px-3 pt-3 sm:-mx-4 sm:px-4">
      {/* 保存結果を操作の近くに置き、長いフォームの下部でも確認できるようにする。 */}
      {error ? <p role="alert" className="mb-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {message ? <div role="status" className="mb-2 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900">{message} {savedId ? <a className="underline" href={'/pedigrees/' + savedId + '/print'} target="_blank" rel="noreferrer">印刷画面を開く</a> : null}</div> : null}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-gray-700">
        <label htmlFor="save-mode">保存後の操作</label>
        {dirty ? <span>未保存の変更があります</span> : null}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 lg:ml-auto lg:max-w-lg">
      <select id="save-mode" className="min-h-11 w-full min-w-0 rounded border border-gray-400 bg-white px-2 py-2 text-base lg:text-sm" value={mode} disabled={saving} onChange={event => setMode(event.target.value as SaveMode)}>
        <option value="save">内容を確認</option><option value="print">印刷</option><option value="sibling">印刷して次のきょうだいへ</option>
      </select>
      <button type="button" className="action-primary" disabled={saving || loading !== null || !canWrite} onClick={() => void save()}>{saving ? '保存しています…' : '保存'}</button>
      </div>
    </div>
  </div>;
}
