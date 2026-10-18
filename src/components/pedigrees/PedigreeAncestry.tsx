'use client';

import { useId, useState, type ChangeEvent } from 'react';
import type { Pedigree } from '@prisma/client';
import type { TextField } from '@/lib/pedigree-fields';
import { pedigreeFieldSize } from '@/lib/pedigree-input-layout';
import { FormInput } from './FormInput';

interface AncestorGroup {
  title: string;
  side: 'father' | 'mother';
  nameField: TextField;
  numberField: TextField;
  fields: readonly (readonly [TextField, string])[];
}

// Access由来の入力順と、父母から3世代までの対応を維持する。
const generations: readonly (readonly AncestorGroup[])[] = [
  [
    { title: '父', side: 'father', nameField: 'fatherCatName', numberField: 'fatherJCU', fields: [['fatherTitle','称号'],['fatherCatName','名前'],['fatherEyeColor','目色'],['fatherCoatColor','色柄'],['fatherJCU','ナンバー']] },
    { title: '母', side: 'mother', nameField: 'motherCatName', numberField: 'motherJCU', fields: [['motherTitle','称号'],['motherCatName','名前'],['motherEyeColor','目色'],['motherCoatColor','色柄'],['motherJCU','ナンバー']] },
  ],
  [
    { title: '父の父', side: 'father', nameField: 'ffCatName', numberField: 'ffjcu', fields: [['ffTitle','称号'],['ffCatName','名前'],['ffCatColor','色柄'],['ffjcu','ナンバー']] },
    { title: '父の母', side: 'father', nameField: 'fmCatName', numberField: 'fmjcu', fields: [['fmTitle','称号'],['fmCatName','名前'],['fmCatColor','色柄'],['fmjcu','ナンバー']] },
    { title: '母の父', side: 'mother', nameField: 'mfCatName', numberField: 'mfjcu', fields: [['mfTitle','称号'],['mfCatName','名前'],['mfCatColor','色柄'],['mfjcu','ナンバー']] },
    { title: '母の母', side: 'mother', nameField: 'mmCatName', numberField: 'mmjcu', fields: [['mmTitle','称号'],['mmCatName','名前'],['mmCatColor','色柄'],['mmjcu','ナンバー']] },
  ],
  [
    { title: '父・父の父', side: 'father', nameField: 'fffCatName', numberField: 'fffjcu', fields: [['fffTitle','称号'],['fffCatName','名前'],['fffjcu','ナンバー']] },
    { title: '父・父の母', side: 'father', nameField: 'ffmCatName', numberField: 'ffmjcu', fields: [['ffmTitle','称号'],['ffmCatName','名前'],['ffmjcu','ナンバー']] },
    { title: '父・母の父', side: 'father', nameField: 'fmfCatName', numberField: 'fmfjcu', fields: [['fmfTitle','称号'],['fmfCatName','名前'],['fmfjcu','ナンバー']] },
    { title: '父・母の母', side: 'father', nameField: 'fmmCatName', numberField: 'fmmjcu', fields: [['fmmTitle','称号'],['fmmCatName','名前'],['fmmjcu','ナンバー']] },
    { title: '母・父の父', side: 'mother', nameField: 'mffCatName', numberField: 'mffjcu', fields: [['mffTitle','称号'],['mffCatName','名前'],['mffjcu','ナンバー']] },
    { title: '母・父の母', side: 'mother', nameField: 'mfmCatName', numberField: 'mfmjcu', fields: [['mfmTitle','称号'],['mfmCatName','名前'],['mfmjcu','ナンバー']] },
    { title: '母・母の父', side: 'mother', nameField: 'mmfCatName', numberField: 'mmfjcu', fields: [['mmfTitle','称号'],['mmfCatName','名前'],['mmfjcu','ナンバー']] },
    { title: '母・母の母', side: 'mother', nameField: 'mmmCatName', numberField: 'mmmjcu', fields: [['mmmTitle','称号'],['mmmCatName','名前'],['mmmjcu','ナンバー']] },
  ],
];

interface AncestryProps {
  formData: Partial<Pedigree>;
  duplicates: ReadonlySet<string>;
  disabled: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>, field: TextField) => void;
}

// 配置見本の略称を同世代へ揃える。読み上げ名とデータ項目は日本語の対応を保つ。
const compactTitles: Record<string, string> = {
  '父': 'Father', '母': 'Mother',
  '父の父': 'FF', '父の母': 'FM', '母の父': 'MF', '母の母': 'MM',
  '父・父の父': 'FFF', '父・父の母': 'FFM', '父・母の父': 'FMF', '父・母の母': 'FMM',
  '母・父の父': 'MFF', '母・父の母': 'MFM', '母・母の父': 'MMF', '母・母の母': 'MMM',
};

function AncestorFields({ group, collapsible, formData, duplicates, disabled, onChange }: AncestryProps & { group: AncestorGroup; collapsible: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const compactTitle = compactTitles[group.title] || group.title;
  const number = formData[group.numberField]?.trim() || '';
  const repeated = number !== '' && duplicates.has(number);
  const sideColor = group.side === 'father' ? 'bg-blue-50' : 'bg-rose-50';

  return <section className={'pedigree-ancestor-card ' + (collapsible ? 'pedigree-ancestor-card--collapsible ' : '') + 'min-w-0 border-b border-gray-300 lg:flex lg:flex-1 lg:flex-col lg:border-r ' + sideColor} aria-label={group.title}>
    <h3 className={'pedigree-ancestor-heading ' + (collapsible ? 'hidden lg:flex' : 'flex') + ' flex-wrap items-center justify-between gap-2 border-b border-gray-300 px-2 py-2 text-sm font-semibold lg:py-1 lg:text-xs'}>
      <span className="lg:hidden">{compactTitle}</span><span className="hidden lg:inline">{group.title}</span>
      {repeated ? <span className="text-blue-700">ナンバー重複</span> : null}
    </h3>
    {collapsible ? <h3 className="lg:hidden">
      <button type="button" className="pedigree-ancestor-toggle flex items-center gap-2 text-left" aria-expanded={expanded} aria-controls={panelId} aria-label={group.title + 'の入力欄を' + (expanded ? '閉じる' : '開く')} onClick={() => setExpanded(previous => !previous)}>
        <span>{compactTitle}</span>
        {repeated ? <span className="text-sm font-semibold text-blue-700">ナンバー重複</span> : null}
      </button>
    </h3> : null}
    {/* 入力欄は一組だけ保持し、狭い幅で閉じても入力値を失わない。閲覧時も開閉できる。 */}
    <div id={panelId} className={!collapsible || expanded ? 'block' : 'hidden lg:block'}>
      <fieldset disabled={disabled} className="pedigree-ancestor-fields">
        <legend className="sr-only">{group.title}の血統情報</legend>
        {group.fields.map(([field,label]) => <FormInput key={field} label={label} aria-label={group.title + ' ' + label} fieldSize={pedigreeFieldSize(field)} value={formData[field] ?? ''} onChange={event => onChange(event,field)} isDuplicate={field === group.numberField && repeated} maxLength={500} />)}
      </fieldset>
    </div>
  </section>;
}

export default function PedigreeAncestry(props: AncestryProps) {
  return <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-0">
    {generations.map((groups,index) => <section key={index} id={['parents','grandparents','great-grandparents'][index]} className="flex min-w-0 scroll-mt-4 flex-col" aria-label={['父母','祖父母','曾祖父母'][index]}>
      <h2 className="border-b border-gray-300 bg-gray-200 px-3 py-2 text-base font-bold lg:px-2 lg:text-sm"><span className="lg:hidden">{['Father,Mother','祖父母','曾祖父母'][index]}</span><span className="hidden lg:inline">{['父母','祖父母','曾祖父母'][index]}</span></h2>
      <div className="flex flex-1 flex-col">
        {groups.map(group => <AncestorFields key={group.title} group={group} collapsible={index > 0} {...props} />)}
      </div>
    </section>)}
  </div>;
}
