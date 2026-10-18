import type { SearchParams, SearchResult } from '@/actions/pedigreeActions';

function pageUrl(params: SearchParams, page: number): string {
  const query = new URLSearchParams();
  for (const field of ['q','breed','coatColor','gender'] as const) if (params[field]) query.set(field, params[field]!);
  query.set('page', String(page));
  return '/pedigrees?' + query.toString();
}

export function DataTable({ result, params }: { result: SearchResult; params: SearchParams }) {
  const { items, total, page, pageSize } = result;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div>
    {/* 同じ検索結果を使い、スマホは主要情報の行、PCは8列の表で表示する。 */}
    <ul aria-label="検索結果" className="divide-y divide-gray-300 rounded border border-gray-300 bg-white xl:hidden">
      {items.length ? items.map(cat => <li key={cat.id} className="flex items-start gap-3 px-3">
        <a className="block min-h-11 min-w-0 flex-1 py-3 hover:bg-blue-50" href={'/pedigrees/' + cat.id}>
          <span className="block break-words text-base font-semibold text-blue-900">{cat.catName || '（名前未登録）'}{cat.catName2 ? <span className="block">{cat.catName2}</span> : null}</span>
          <span className="mt-1 block break-words text-sm tabular-nums text-gray-700">本猫ID {cat.pedigreeId}</span>
          <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-1 break-words text-sm text-gray-700">
            <div className="min-w-0"><dt className="sr-only">猫種</dt><dd>{cat.breed?.name || cat.breedCode || '猫種未入力'}</dd></div>
            <div className="min-w-0"><dt className="sr-only">性別</dt><dd>{cat.gender?.name || cat.genderCode || '性別未入力'}</dd></div>
            <div className="min-w-0"><dt className="sr-only">誕生日</dt><dd>誕生日 {cat.birthDate || '未入力'}</dd></div>
          </dl>
        </a>
        <a className="action-secondary my-3 shrink-0" href={'/pedigrees/' + cat.id + '/print'} aria-label={'ID ' + cat.pedigreeId + ' の血統書を印刷'} target="_blank" rel="noreferrer">印刷</a>
      </li>) : <li className="p-5 text-gray-700">該当する猫が見つかりません。検索条件を変えてください。</li>}
    </ul>
    <div className="hidden overflow-x-auto rounded border border-gray-300 bg-white xl:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-100"><tr>{['本猫ID','名前','猫種','性別','色柄','誕生日','所有者','操作'].map(label => <th key={label} className="whitespace-nowrap border-b px-3 py-3 font-medium">{label}</th>)}</tr></thead>
        <tbody>{items.length ? items.map(cat => <tr key={cat.id} className="border-b last:border-0 hover:bg-blue-50">
          <td className="px-3 py-3 tabular-nums"><a className="text-blue-700 underline" href={'/pedigrees/' + cat.id}>{cat.pedigreeId}</a></td>
          <td className="min-w-52 px-3 py-3"><a className="font-medium text-blue-900 hover:underline" href={'/pedigrees/' + cat.id}>{cat.catName || '（名前未登録）'}{cat.catName2 ? <span className="block text-gray-600">{cat.catName2}</span> : null}</a></td>
          <td className="px-3 py-3">{cat.breed?.name || cat.breedCode || '—'}</td>
          <td className="whitespace-nowrap px-3 py-3">{cat.gender?.name || cat.genderCode || '—'}</td>
          <td className="min-w-36 px-3 py-3">{cat.coatColor?.name || cat.coatColorCode || '—'}</td>
          <td className="whitespace-nowrap px-3 py-3">{cat.birthDate || '—'}</td>
          <td className="min-w-32 px-3 py-3">{cat.ownerName || '—'}</td>
          <td className="whitespace-nowrap px-3 py-3"><a className="text-blue-700 underline" href={'/pedigrees/' + cat.id + '/print'} target="_blank" rel="noreferrer">印刷</a></td>
        </tr>) : <tr><td colSpan={8} className="p-8 text-center text-gray-600">該当する猫が見つかりません。検索条件を変えてください。</td></tr>}</tbody>
      </table>
    </div>
    <nav aria-label="検索結果のページ" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p role="status">{total.toLocaleString('ja-JP')}件{total ? '中 ' + ((page - 1) * pageSize + 1) + '〜' + Math.min(page * pageSize, total) + '件' : ''}　{page} / {pages}ページ</p>
      <div className="flex gap-2">{page > 1 ? <a className="action-secondary" href={pageUrl(params, page - 1)}>前へ</a> : null}{page < pages ? <a className="action-secondary" href={pageUrl(params, page + 1)}>次へ</a> : null}</div>
    </nav>
  </div>;
}
