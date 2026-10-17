import type { SearchParams } from '@/actions/pedigreeActions';
import type { PedigreeMasters } from '@/components/pedigrees/PedigreeForm';

export function DataTableToolbar({ params, masters }: { params: SearchParams; masters: PedigreeMasters }) {
  return <form action="/pedigrees" className="mb-4 flex flex-wrap items-end gap-3">
    <div className="min-w-52 flex-1">
      <label className="mb-1 block text-xs font-medium" htmlFor="search-q">ID・名前・所有者・父母ナンバーなど</label>
      <input id="search-q" name="q" defaultValue={params.q || ''} maxLength={200} className="w-full rounded border border-gray-400 bg-white px-3 py-2" />
    </div>
    {([
      ['breed','猫種',masters.breeds], ['coatColor','色柄',masters.colors], ['gender','性別',masters.genders],
    ] as const).map(([name,label,options]) => <div key={name} className="w-36 grow sm:grow-0">
      <label className="mb-1 block text-xs font-medium" htmlFor={'search-' + name}>{label}</label>
      <input id={'search-' + name} name={name} list={'search-' + name + '-options'} defaultValue={params[name] || ''} maxLength={100} className="w-full rounded border border-gray-400 bg-white px-3 py-2" />
      <datalist id={'search-' + name + '-options'}>{options.map(option => <option key={option.code} value={option.code + ' ' + option.name} />)}</datalist>
    </div>)}
    <button className="action-primary">検索</button>
    <a className="action-secondary" href="/pedigrees">解除</a>
  </form>;
}
