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
const lookupLabels: Record<LookupRole, string> = { self: '本猫ID', shared: '両親ID', father: '父猫ID', mother: '母猫ID' };

export default function PedigreeForm({ masters, canWrite }: { masters: PedigreeMasters; canWrite: boolean }) {
  const { formData, updateField, setFormData, mergeAncestryData } = usePedigreeStore();
  const duplicates = useMemo(() => getDuplicateIdentifiers(formData), [formData]);
  const [lookup, setLookup] = useState<Record<LookupRole, string>>({ self: '', shared: '', father: '', mother: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirtyState] = useState(false);
  const [mode, setMode] = useState<SaveMode>('save');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const requestId = useRef<string | null>(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);
  const lookupVersions = useRef<Record<LookupRole, number>>({ self: 0, shared: 0, father: 0, mother: 0 });
  const handledBlurVersions = useRef<Partial<Record<LookupRole, number>>>({});
  const lookupFailures = useRef<Partial<Record<LookupRole, string>>>({});
  const pendingLookups = useRef(new Map<string, Promise<boolean>>());
  const lookupQueue = useRef(Promise.resolve(true));
  const formRef = useRef<HTMLDivElement>(null);
  const savebarRef = useRef<HTMLDivElement>(null);
  useFormViewport(formRef, savebarRef);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // 非同期の呼び出しでも、未保存状態を常に最新の値で確認する。
  function setDirty(value: boolean) {
    dirtyRef.current = value;
    setDirtyState(value);
  }

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

  function changeLookup(role: LookupRole, value: string) {
    lookupVersions.current[role] += 1;
    // IDを修正したら、その欄の呼び出しエラーだけを解除する。
    const hadFailure = lookupFailures.current[role] !== undefined;
    delete lookupFailures.current[role];
    if (hadFailure) setError(Object.values(lookupFailures.current)[0] || '');
    setLookup(previous => ({ ...previous, [role]: value }));
  }

  function fetchCat(role: LookupRole, value: string, trigger: 'enter' | 'blur'): Promise<boolean> {
    const key = value.trim();
    if (!key || savingRef.current) return Promise.resolve(true);
    const version = lookupVersions.current[role];
    if (trigger === 'blur' && handledBlurVersions.current[role] === version) return Promise.resolve(true);
    handledBlurVersions.current[role] = version;
    const jobId = role + ':' + version;
    const pending = pendingLookups.current.get(jobId);
    if (pending) return pending;
    const isCurrent = () => mountedRef.current && lookupVersions.current[role] === version;

    // Enter直後のフォーカス移動は重複させず、異なるID欄の呼び出しは順番に処理する。
    const operation = lookupQueue.current.then(async () => {
      if (!isCurrent()) return true;
      const fail = (message: string) => {
        const detail = lookupLabels[role] + '：' + message;
        lookupFailures.current[role] = detail;
        setError(detail);
        return false;
      };
      try {
        delete lookupFailures.current[role];
        setError(Object.values(lookupFailures.current)[0] || ''); setMessage('');
        if (!/^\d{1,10}$/.test(key)) return fail('呼び出す猫の数字IDを入力してください。');
        if (dirtyRef.current && role === 'self' && !window.confirm('入力中の内容を置き換えて、指定した猫を開きますか？')) return true;
        const record = await getPedigreeByKey(key);
        // 待っている間にIDが変わった場合や画面を離れた場合は、古い結果を反映しない。
        if (!isCurrent()) return true;
        if (!record) return fail('そのIDの猫が見つかりませんでした。');
        if (role === 'self') { setFormData(record); setDirty(false); setSavedId(null); requestId.current = null; lookupFailures.current = {}; window.history.replaceState(null,'','/pedigrees/' + record.id); }
        else if (role === 'shared') { setFormData({ ...usePedigreeStore.getState().formData, ...ancestryOf(record) }); setDirty(true); }
        else { mergeAncestryData(record, role); setDirty(true); }
        setError(Object.values(lookupFailures.current)[0] || '');
        setMessage('呼び出しました。');
        return true;
      } catch {
        return isCurrent() ? fail('猫の情報を呼び出せませんでした。通信を確認して、もう一度お試しください。') : true;
      }
    }).finally(() => {
      pendingLookups.current.delete(jobId);
      if (mountedRef.current) setLoading(pendingLookups.current.size > 0);
    });
    pendingLookups.current.set(jobId, operation);
    lookupQueue.current = operation;
    setLoading(true);
    return operation;
  }

  async function save() {
    if (savingRef.current || !canWrite) return;
    const failedLookup = Object.values(lookupFailures.current)[0];
    if (failedLookup) { setError(failedLookup); return; }
    savingRef.current = true;
    const printWindow = mode !== 'save' ? window.open('about:blank', '_blank') : null;
    if (printWindow) printWindow.opener = null;
    setSaving(true); setError(''); setMessage('');
    try {
      // ID欄から保存へ移った場合も、呼び出した最新の内容が揃ってから保存する。
      const outcomes = await Promise.all([...pendingLookups.current.values()]);
      if (outcomes.some(ok => !ok)) { printWindow?.close(); return; }
      const current = usePedigreeStore.getState().formData;
      requestId.current ??= crypto.randomUUID();
      const result = await savePedigree({ recordId: current.id, expectedUpdatedAt: current.updatedAt ? new Date(current.updatedAt).toISOString() : undefined, requestId: requestId.current, draft: current });
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
    finally { savingRef.current = false; setSaving(false); }
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
    <div className="pedigree-form-heading mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <h1 className="pedigree-form-title text-xl font-bold">{formData.id ? '血統情報の編集' : '血統情報の新規登録'}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {formData.id ? <a className="action-secondary" href={'/pedigrees/new?sibling=' + formData.id}>きょうだいを登録</a> : null}
        <button type="button" className="pedigree-new-cat action-secondary" onClick={newCat} disabled={saving}>新しい猫</button>
        {formData.id ? <a className="action-secondary" href={'/pedigrees/' + formData.id + '/print'} target="_blank" rel="noreferrer">印刷</a> : null}
      </div>
    </div>
    <div className="pedigree-lookups mb-3">
      {(['self','shared','father','mother'] as const).map(role => <div key={role} className="pedigree-lookup-group">
        <label className="sr-only" htmlFor={'lookup-' + role}>{lookupLabels[role]}</label>
        <input id={'lookup-' + role} className="pedigree-lookup block rounded border border-gray-400 bg-white px-2 text-base" inputMode="numeric" autoComplete="off" placeholder={lookupLabels[role]} aria-label={role === 'self' ? '本猫を呼び出すID' : undefined} value={lookup[role]} disabled={saving} onChange={event => changeLookup(role, event.target.value)} onBlur={event => { void fetchCat(role, event.currentTarget.value, 'blur'); }} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && !event.repeat) { event.preventDefault(); void fetchCat(role, event.currentTarget.value, 'enter'); } }} />
      </div>)}
    </div>
    {loading ? <p role="status" className="mb-3">猫の情報を呼び出しています…</p> : null}
    {!canWrite ? <p className="mb-3 text-amber-800">現在は閲覧用です。</p> : null}
    <nav aria-label="フォーム内の移動" className="pedigree-section-nav mb-3 flex flex-wrap gap-2 lg:hidden">
      {([['cat-details','本猫'],['parents','父母'],['grandparents','祖父母'],['great-grandparents','曾祖父母']] as const).map(([id,label]) => <a key={id} className="action-secondary" href={'#' + id}>{label}</a>)}
    </nav>
    <section id="cat-details" className="mb-4 scroll-mt-4" aria-labelledby="cat-details-heading">
      <h2 id="cat-details-heading" className="bg-gray-200 px-3 py-2 text-base font-bold lg:px-2 lg:text-sm">本猫</h2>
      <fieldset disabled={saving || loading || !canWrite} className="min-w-0">
      <div className="pedigree-basic-grid">
        <div className="pedigree-details-column">
          {/* 配置見本に合わせ、IDと名前を同じ行、性別をその次にする。 */}
          <div className="pedigree-cat-identity pedigree-field-row"><FormInput label="本猫ID" fieldSize="id" value={formData.pedigreeId || ''} readOnly />{input('catName','名前')}</div>
          {master('genderCode','性別',masters.genders)}
          {master('breedCode','猫種',masters.breeds)}{master('coatColorCode','色柄',masters.colors)}
        </div>
        <div className="pedigree-details-column"><div className="pedigree-field-row">{input('birthDate','誕生日')}{input('registrationDate','登録日')}{input('eyeColor','目色')}</div>{input('breederName','繁殖者')}{input('ownerName','所有者')}</div>
        <div className="pedigree-details-column md:col-span-2 lg:col-span-1">
          <div className="pedigree-field-row">{(['brotherCount','sisterCount'] as const).map((field,index) => <FormInput key={field} label={index === 0 ? '兄弟' : '姉妹'} aria-label={index === 0 ? '兄弟 M' : '姉妹 F'} fieldSize="count" inputMode="numeric" pattern="[0-9]*" value={formData[field] ?? ''} onChange={event => changeNumber(event,field)} />)}{input('title','称号')}</div>
          {input('notes','摘要1')}{input('otherNo','他団体No')}
          <FormInput label="本猫ナンバー" fieldSize="number" value={compositeId} readOnly />
        </div>
      </div>
      </fieldset>
    </section>
    <PedigreeAncestry formData={formData} duplicates={duplicates} disabled={saving || loading || !canWrite} onChange={changeText} />
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
      <button type="button" className="action-primary" disabled={saving || !canWrite} onClick={() => void save()}>{saving ? '保存しています…' : '保存'}</button>
      </div>
    </div>
  </div>;
}
