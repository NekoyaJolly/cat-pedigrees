import { searchPedigreePage, getBreeds, getCoatColors, getGenders, type SearchParams } from '@/actions/pedigreeActions';
import { DataTable } from './data-table';
import { DataTableToolbar } from './data-table-toolbar';

export const metadata = { title: '一覧・検索 | 血統書管理' };

export default async function PedigreesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const [result, breeds, colors, genders] = await Promise.all([searchPedigreePage(params), getBreeds(), getCoatColors(), getGenders()]);
  return <div className="mx-auto w-full max-w-screen-2xl">
    <div className="mb-4 flex items-center justify-between gap-3"><h1 className="text-xl font-bold">一覧・検索</h1><a className="action-primary" href="/pedigrees/new">新規登録</a></div>
    <DataTableToolbar params={params} masters={{ breeds, colors, genders }} />
    <DataTable result={result} params={params} />
  </div>;
}
