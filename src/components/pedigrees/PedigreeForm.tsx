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
import { pedigreeFieldSize } from '@/lib/pedigree-input-layout';

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
    // 数字用キーボードを使い、コード欄に符号や指数表記が入るのを防ぐ。
    if (!/^\d*$/.test(event.target.value)) return;
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
      setMessage('呼び出しました。');
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
        setMessage('ID ' + record.pedigreeId + ' を保存しました。');
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
  const input = (field: TextField, label: string) => <FormInput key={field} label={label} fieldSize={pedigreeFieldSize(field)} inputMode={field === 'birthDate' || field === 'registrationDate' ? 'decimal' : undefined} value={formData[field] ?? ''} maxLength={field === 'notes' || field === 'notes2' ? 2000 : 500} onChange={event => changeText(event, field)} isDuplicate={duplicates.has(String(formData[field] ?? '').trim())} />;
  const master = (field: 'breedCode' | 'coatColorCode' | 'genderCode', label: string, values: MasterOption[]) => <div key={field} className={'pedigree-master' + (field === 'genderCode' ? ' pedigree-master--gender' : '')}>
    <FormInput id={'field-' + field} label={label} fieldSize={field === 'genderCode' ? 'gender' : 'code'} inputMode="numeric" pattern="[0-9]*" list={field + '-options'} value={formData[field] ?? ''} onChange={event => changeNumber(event, field)} />
    <datalist id={field + '-options'}>{values.map(value => <option key={value.code} value={value.code}>{value.name}</option>)}</datalist>
    <output htmlFor={'field-' + field} className="pedigree-master-name">{values.find(value => value.code === formData[field])?.name || '—'}</output>
  </div>;

  return <div ref={formRef} className="mx-auto w-full min-w-0 max-w-6xl rounded-lg border border-gray-300 bg-white p-2 text-base sm:p-4 lg:text-sm">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <h1 className="text-xl font-bold">{formData.id ? '血統情報の編集' : '血統情報の新規登録'}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {formData.id ? <a className="action-secondary" href={'/pedigrees/new?sibling=' + formData.id}>きょうだいを登録</a> : null}
        <button type="button" className="action-secondary" onClick={newCat} disabled={saving}>新しい猫</button>
        {formData.id ? <a className="action-secondary" href={'/pedigrees/' + formData.id + '/print'} target="_blank" rel="noreferrer">印刷</a> : null}
      </div>
    </div>
    <div className="pedigree-lookups mb-3">
      {(['self','shared','father','mother'] as const).map(role => <div key={role} className="pedigree-lookup-group">
        <label className="mb-1 block text-sm font-medium" htmlFor={'lookup-' + role}>{({ self: '本猫ID', shared: '両親ID', father: '父猫ID', mother: '母猫ID' })[role]}</label>
        <div className="flex gap-1">
          <input id={'lookup-' + role} className="pedigree-lookup min-h-11 rounded border border-gray-400 bg-white px-2 py-2 text-base" inputMode="numeric" autoComplete="off" aria-label={role === 'self' ? '本猫を呼び出すID' : undefined} value={lookup[role]} disabled={saving || loading !== null} onChange={event => setLookup({ ...lookup, [role]: event.target.value })} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void fetchCat(role); } }} />
          <button type="button" className="action-secondary shrink-0 whitespace-nowrap px-2" aria-label={({ self: '本猫', shared: '両親', father: '父猫', mother: '母猫' })[role] + 'を呼び出す'} disabled={saving || loading !== null || !lookup[role]} onClick={() => void fetchCat(role)}>呼出</button>
        </div>
      </div>)}
    </div>
    {loading ? <p role="status" className="mb-3">猫の情報を呼び出しています…</p> : null}
    {!canWrite ? <p className="mb-3 text-amber-800">現在は閲覧用です。</p> : null}
    <nav aria-label="フォーム内の移動" className="mb-3 flex flex-wrap gap-2 lg:hidden">
      {([['cat-details','本猫'],['parents','父母'],['grandparents','祖父母'],['great-grandparents','曾祖父母']] as const).map(([id,label]) => <a key={id} className="action-secondary" href={'#' + id}>{label}</a>)}
    </nav>
    <section id="cat-details" className="mb-4 scroll-mt-4" aria-labelledby="cat-details-heading">
      <h2 id="cat-details-heading" className="bg-gray-200 px-3 py-2 text-base font-bold lg:px-2 lg:text-sm">本猫</h2>
      <fieldset disabled={saving || loading !== null || !canWrite} className="min-w-0">
      <div className="pedigree-basic-grid">
        <div className="pedigree-details-column">
          <div className="pedigree-field-row"><FormInput label="本猫ID" fieldSize="id" value={formData.pedigreeId || ''} placeholder="—" readOnly />{master('genderCode','性別',masters.genders)}</div>
          {input('catName','名前')}{input('catName2','名前の続き')}
          {master('breedCode','猫種',masters.breeds)}{master('coatColorCode','色柄',masters.colors)}
        </div>
        <div className="pedigree-details-column"><div className="pedigree-field-row">{input('birthDate','誕生日')}{input('registrationDate','登録日')}{input('eyeColor','目色')}</div>{input('breederName','繁殖者')}{input('ownerName','所有者')}</div>
        <div className="pedigree-details-column md:col-span-2 lg:col-span-1">
          <div className="pedigree-field-row">{(['brotherCount','sisterCount'] as const).map((field,index) => <FormInput key={field} label={index === 0 ? '兄弟' : '姉妹'} aria-label={index === 0 ? '兄弟 M' : '姉妹 F'} fieldSize="count" inputMode="numeric" pattern="[0-9]*" value={formData[field] ?? ''} onChange={event => changeNumber(event,field)} />)}{input('title','称号')}</div>
          {input('notes','摘要1')}{input('notes2','摘要2')}{input('otherNo','他団体No')}
          <FormInput label="本猫ナンバー" fieldSize="number" value={compositeId} readOnly />
        </div>
      </div>
      </fieldset>
    </section>
    <PedigreeAncestry formData={formData} duplicates={duplicates} disabled={saving || loading !== null || !canWrite} onChange={changeText} />
    <div ref={savebarRef} className="pedigree-savebar sticky bottom-0 z-10 -mx-2 mt-3 border-t border-gray-300 bg-white px-2 pt-2 sm:-mx-4 sm:px-4">
      {/* 保存結果を操作の近くに置き、長いフォームの下部でも確認できるようにする。 */}
      {error ? <p role="alert" className="mb-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {message ? <div role="status" className="mb-2 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900">{message} {savedId ? <a className="underline" href={'/pedigrees/' + savedId + '/print'} target="_blank" rel="noreferrer">印刷画面を開く</a> : null}</div> : null}
      <label htmlFor="save-mode" className="sr-only">保存後の操作</label>
      {dirty ? <p className="mb-1 text-right text-sm text-amber-800">未保存</p> : null}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 lg:ml-auto lg:max-w-lg">
      <select id="save-mode" className="min-h-11 w-full min-w-0 rounded border border-gray-400 bg-white px-2 py-2 text-base lg:text-sm" value={mode} disabled={saving} onChange={event => setMode(event.target.value as SaveMode)}>
        <option value="save">保存のみ</option><option value="print">印刷</option><option value="sibling">印刷してきょうだい登録</option>
      </select>
      <button type="button" className="action-primary" disabled={saving || loading !== null || !canWrite} onClick={() => void save()}>{saving ? '保存しています…' : '保存'}</button>
      </div>
    </div>
  </div>;
}
