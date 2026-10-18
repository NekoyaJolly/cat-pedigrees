'use client';

import { useEffect, useRef, useState } from 'react';
import type { PedigreeWithRelations } from '@/actions/pedigreeActions';
import { getDuplicateIdentifiers } from '@/utils/duplicateChecker';
import { generateCatCompositeId } from '@/utils/idGenerator';
import { transformToPedigreeTree, type PedigreeNode } from '@/utils/pedigreeTransformer';
import { loadCertificateFonts, renderCertificatePdf } from '@/utils/certificatePdf';
import { ancestorCertificatePosition, certificateValuePositions, formatCertificateText, type CertificateAncestorField, type CertificatePosition, type CertificateValueField } from '@/utils/certificateLayout';
import './certificate-print.css';

function mm(position: CertificatePosition) {
  return { left: position.x + 'mm', top: position.y + 'mm', width: position.width + 'mm', height: position.height + 'mm', fontSize: position.fontSize ? position.fontSize + 'pt' : undefined };
}

function Ancestor({ node, duplicates, level = 1 }: { node: PedigreeNode; duplicates: Set<string>; level?: number }) {
  const fields: Array<{ field: CertificateAncestorField; text: string | null | undefined }> = [
    { field: 'title', text: node.title }, { field: 'name', text: formatCertificateText(node.name) },
    { field: 'name2', text: formatCertificateText(node.name2) }, { field: 'color', text: formatCertificateText(node.coatColor) },
    { field: 'eye', text: formatCertificateText(node.eyeColor) }, { field: 'number', text: node.jcu },
    { field: 'other', text: node.otherCode },
  ];
  return <>
    <div data-relation={node.relation} className={'certificate-ancestor certificate-generation-' + level + (duplicates.has(node.jcu?.trim() || '') ? ' certificate-duplicate' : '')}>
      {fields.map(({ field, text }) => {
        const position = ancestorCertificatePosition(node.relation, field);
        if (!position || (!text && (field === 'name2' || field === 'other'))) return null;
        return <div key={field} data-field={field} className={'certificate-field certificate-' + field} style={mm(position)}>{text ?? ''}</div>;
      })}
    </div>
    {node.parents.map(parent => <Ancestor key={parent.relation} node={parent} duplicates={duplicates} level={level + 1} />)}
  </>;
}

export default function CertificatePrint({ record }: { record: PedigreeWithRelations }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [includePaper, setIncludePaper] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [error, setError] = useState('');
  const certificate = useRef<HTMLDivElement>(null);
  const tree = transformToPedigreeTree(record);
  const duplicates = getDuplicateIdentifiers(record);

  useEffect(() => {
    let active = true;
    try {
      const saved = JSON.parse(localStorage.getItem('pedigree-print-offset-v1') || 'null') as { x: number; y: number } | null;
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y) && Math.abs(saved.x) <= 10 && Math.abs(saved.y) <= 10) setOffset(saved);
    } catch { /* 保存済みの位置が読めない場合は、基準位置を使う。 */ }
    void loadCertificateFonts().then(() => {
      if (!active || !certificate.current) return;
      setFontsReady(true);
      setOverflow([...certificate.current.querySelectorAll<HTMLElement>('.certificate-field, .certificate-value')].some(element => element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1));
    }).catch(() => {
      if (active) setError('印刷書体を読み込めませんでした。ページを再読み込みしてください。');
    });
    return () => { active = false; };
  }, []);

  function adjust(axis: 'x' | 'y', value: string) {
    const parsed = Number(value);
    const next = { ...offset, [axis]: Number.isFinite(parsed) ? Math.max(-10, Math.min(10, parsed)) : 0 };
    setOffset(next);
    try { localStorage.setItem('pedigree-print-offset-v1', JSON.stringify(next)); } catch { /* 保存できない端末でも今回の調整は使える。 */ }
  }
  async function downloadPdf() {
    if (!certificate.current || generating || !fontsReady) return;
    setGenerating(true); setError('');
    try {
      const data = await renderCertificatePdf(certificate.current,includePaper);
      const url = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: 'application/pdf' }));
      const link = document.createElement('a'); link.href = url; link.download = 'WCA-' + record.pedigreeId + '.pdf'; link.click();
      setTimeout(() => URL.revokeObjectURL(url),60000);
    } catch { setError('PDFを作成できませんでした。印刷ボタンからも保存できます。'); }
    finally { setGenerating(false); }
  }
  const value = (field: CertificateValueField, text: string | number | null | undefined, className = '') => <div data-field={field} className={'certificate-value ' + className} style={mm(certificateValuePositions[field])}>{text ?? ''}</div>;
  const pdfButtonLabel = generating ? 'PDFを作成中…' : fontsReady ? 'PDF保存（339×239mm）' : error ? '書体を確認してください' : '書体を読み込み中…';

  return <div className="print-view">
    <div className="print-controls mx-auto mb-5 max-w-5xl rounded border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h1 className="text-lg font-bold">血統書の印刷 · ID {record.pedigreeId}</h1><div className="flex flex-wrap gap-2"><a href={'/pedigrees/' + record.id} className="action-secondary">内容を編集</a><button className="action-secondary" disabled={!fontsReady} onClick={() => window.print()}>印刷</button><button className="action-primary" disabled={generating || !fontsReady} onClick={() => void downloadPdf()}>{pdfButtonLabel}</button></div></div>
      <p className="text-sm text-gray-700">用紙は339×239mm、倍率は100%、余白なし、ヘッダー・フッターなしに設定してください。</p>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <label>横位置 <input aria-label="印刷の横位置" type="number" min="-10" max="10" step="0.5" value={offset.x} onChange={event => adjust('x', event.target.value)} className="w-20 rounded border p-1" /> mm</label>
        <label>縦位置 <input aria-label="印刷の縦位置" type="number" min="-10" max="10" step="0.5" value={offset.y} onChange={event => adjust('y', event.target.value)} className="w-20 rounded border p-1" /> mm</label>
        <button className="text-blue-700 underline" onClick={() => { adjust('x', '0'); setOffset({ x: 0, y: 0 }); try { localStorage.removeItem('pedigree-print-offset-v1'); } catch { /* 画面の位置はリセット済み。 */ } }}>位置をリセット</button>
        <label className="flex items-center gap-2"><input type="checkbox" checked={includePaper} onChange={event => setIncludePaper(event.target.checked)} />台紙画像も印刷する（確認用）</label>
      </div>
      <p className="mt-3 text-xs text-gray-600">プレビューには添付の台紙を表示しています。通常は文字だけを印刷します。初回は試し刷りで位置を合わせてください。</p>
      {overflow ? <p role="alert" className="mt-3 text-sm text-red-800">枠に収まらない長い文字があります。印刷前に内容を確認してください。</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-800">{error}</p> : null}
    </div>
    <div className="certificate-scroll">
      <div ref={certificate} className={'print-certificate' + (includePaper ? ' include-paper' : '')}>
        {/* 台紙は印刷位置の目安。通常の本刷りでは文字だけを出力する。 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="certificate-paper" src="/certificate-template.jpg" alt="血統書の台紙" width={1537} height={1051} />
        <div className="certificate-text-layer" style={{ transform: `translate(${offset.x}mm, ${offset.y}mm)` }}>
          {value('breed', formatCertificateText(record.breed?.name))}
          {value('gender', formatCertificateText(record.gender?.name))}
          {value('birth', record.birthDate)}
          {value('eye', formatCertificateText(record.eyeColor))}
          {value('color', formatCertificateText(record.coatColor?.name))}
          {value('name', [record.title, formatCertificateText(record.catName), formatCertificateText(record.catName2)].filter(Boolean).join(' '), 'certificate-self-name')}
          {value('number', generateCatCompositeId(record.breedCode, record.coatColorCode, record.genderCode, record.pedigreeId))}
          {value('owner', formatCertificateText(record.ownerName), 'certificate-align-right')}
          {value('breeder', formatCertificateText(record.breederName), 'certificate-align-right')}
          {value('date', record.registrationDate)}
          {value('brother', record.brotherCount, 'certificate-center')}
          {value('sister', record.sisterCount, 'certificate-center')}
          {value('other', record.otherNo)}
          {tree.parents.map(parent => <Ancestor key={parent.relation} node={parent} duplicates={duplicates} />)}
        </div>
      </div>
    </div>
  </div>;
}
