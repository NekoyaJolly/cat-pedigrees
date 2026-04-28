import { searchPedigrees, getBreeds, getCoatColors, getGenders } from '@/actions/pedigreeActions';
import { columns } from './columns';
import { DataTable } from './data-table';

export const metadata = {
  title: '血統書一覧',
};

export default async function PedigreesPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await props.searchParams;
  const pedigrees = await searchPedigrees(params);
  const rawBreeds = await getBreeds();
  const rawCoatColors = await getCoatColors();
  const rawGenders = await getGenders();

  const breeds = rawBreeds.map(b => ({
    label: `${b.code} ${b.name}`,
    value: `${b.code} ${b.name}`
  }));

  const coatColors = rawCoatColors.map(c => ({
    label: `${c.code} ${c.name}`,
    value: `${c.code} ${c.name}`
  }));

  const genders = rawGenders.map(g => ({
    label: `${g.code} ${g.name}`,
    value: `${g.code} ${g.name}`
  }));

  return (
    <div className="container mx-auto py-10 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">血統書一覧</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-1">
        <DataTable 
          columns={columns} 
          data={pedigrees} 
          breeds={breeds}
          coatColors={coatColors}
          genders={genders}
        />
      </div>
    </div>
  );
}
