'use client';

import { useEffect, useRef, useState } from 'react';
import type { PedigreeWithRelations } from '@/actions/pedigreeActions';
import { getDuplicateIdentifiers } from '@/utils/duplicateChecker';
import { generateCatCompositeId } from '@/utils/idGenerator';
import { transformToPedigreeTree, type PedigreeNode } from '@/utils/pedigreeTransformer';
import { loadCertificateFonts, renderCertificatePdf } from '@/utils/certificatePdf';
import './certificate-print.css';

interface Position { x: number; y: number; width: number; height?: number }
const positions: Record<string, Position> = {
  father: { x: 49.5, y: 103, width: 58, height: 43 }, mother: { x: 49.5, y: 156, width: 58, height: 43 },
  ff: { x: 141.5, y: 94, width: 56, height: 24 }, fm: { x: 141.5, y: 121, width: 56, height: 24 },
  mf: { x: 141.5, y: 147.5, width: 56, height: 24 }, mm: { x: 141.5, y: 174, width: 56, height: 24 },
  fff: { x: 234.5, y: 94, width: 57, height: 12 }, ffm: { x: 234.5, y: 107.3, width: 57, height: 12 },
  fmf: { x: 234.5, y: 120.6, width: 57, height: 12 }, fmm: { x: 234.5, y: 134, width: 57, height: 12 },
  mff: { x: 234.5, y: 147.3, width: 57, height: 12 }, mfm: { x: 234.5, y: 160.6, width: 57, height: 12 },
  mmf: { x: 234.5, y: 174, width: 57, height: 12 }, mmm: { x: 234.5, y: 187.3, width: 57, height: 12 },
};

function mm(position: Position) {
  return { left: position.x + 'mm', top: position.y + 'mm', width: position.width + 'mm', height: position.height ? position.height + 'mm' : undefined };
}

function Ancestor({ node, duplicates, level = 1 }: { node: PedigreeNode; duplicates: Set<string>; level?: number }) {
  const position = positions[node.relation];
  return <>
    {position ? <div style={mm(position)} className={'certificate-ancestor certificate-generation-' + level + (duplicates.has(node.jcu?.trim() || '') ? ' certificate-duplicate' : '')}>
      <div className="certificate-title">{node.title}</div>
      <div className="certificate-name">{node.name}</div>
      {node.name2 ? <div className="certificate-name">{node.name2}</div> : null}
      {level < 3 ? <div className="certificate-color">{node.coatColor}</div> : null}
      {level === 1 ? <div className="certificate-eye">{node.eyeColor}</div> : null}
      <div className="certificate-number">{node.jcu}</div>
      {level === 1 && node.otherCode ? <div className="certificate-other">{node.otherCode}</div> : null}
    </div> : null}
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
      setOverflow([...certificate.current.querySelectorAll<HTMLElement>('.certificate-ancestor, .certificate-value')].some(element => element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1));
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
  const value = (text: string | number | null | undefined, x: number, y: number, width: number, height = 5, className = '') => <div className={'certificate-value ' + className} style={mm({ x, y, width, height })}>{text ?? ''}</div>;
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
          {value(record.breed?.name, 49.5, 51, 46)}
          {value(record.gender?.name, 49.5, 61.5, 25)}
          {value(record.birthDate, 77.8, 61.5, 38)}
          {value(record.eyeColor, 49.5, 71.8, 26)}
          {value(record.coatColor?.name, 77.8, 71.8, 38)}
          {value([record.title, record.catName, record.catName2].filter(Boolean).join(' '), 131, 55, 83, 12, 'certificate-self-name')}
          {value(generateCatCompositeId(record.breedCode, record.coatColorCode, record.genderCode, record.pedigreeId), 164, 71.8, 45)}
          {value(record.ownerName, 231, 50.5, 60, 5, 'certificate-align-right')}
          {value(record.breederName, 231, 60.8, 60, 5, 'certificate-align-right')}
          {value(record.registrationDate, 230, 72, 43)}
          {value(record.brotherCount, 273.5, 72, 10, 5, 'certificate-center')}
          {value(record.sisterCount, 284, 72, 10, 5, 'certificate-center')}
          {value(record.otherNo, 49.5, 214, 58)}
          {tree.parents.map(parent => <Ancestor key={parent.relation} node={parent} duplicates={duplicates} />)}
        </div>
      </div>
    </div>
  </div>;
}
