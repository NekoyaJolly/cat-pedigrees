import type { SearchParams } from '@/actions/pedigreeActions';
import type { PedigreeMasters } from '@/components/pedigrees/PedigreeForm';

export function DataTableToolbar({ params, masters }: { params: SearchParams; masters: PedigreeMasters }) {
  // 検索条件とページ切替は従来どおりURLに保持する。
  return <form action="/pedigrees" className="mb-4 grid grid-cols-2 items-end gap-3 lg:flex lg:flex-wrap">
    <div className="col-span-2 min-w-0 lg:min-w-52 lg:flex-1">
      <label className="mb-1 block text-sm font-medium" htmlFor="search-q">ID・名前・所有者・父母ナンバーなど</label>
      <input id="search-q" name="q" defaultValue={params.q || ''} maxLength={200} className="min-h-11 w-full min-w-0 rounded border border-gray-400 bg-white px-3 py-2 text-base" />
    </div>
    {([
      ['breed','猫種',masters.breeds], ['coatColor','色柄',masters.colors], ['gender','性別',masters.genders],
    ] as const).map(([name,label,options]) => <div key={name} className="min-w-0 lg:w-36">
      <label className="mb-1 block text-sm font-medium" htmlFor={'search-' + name}>{label}</label>
      <input id={'search-' + name} name={name} list={'search-' + name + '-options'} defaultValue={params[name] || ''} maxLength={100} className="min-h-11 w-full min-w-0 rounded border border-gray-400 bg-white px-3 py-2 text-base" />
      <datalist id={'search-' + name + '-options'}>{options.map(option => <option key={option.code} value={option.code + ' ' + option.name} />)}</datalist>
    </div>)}
    <div className="flex flex-wrap gap-2">
      <button className="action-primary">検索</button>
      <a className="action-secondary" href="/pedigrees">解除</a>
    </div>
  </form>;
}
