import { getPedigreeById } from '@/actions/pedigreeActions';
import { notFound } from 'next/navigation';
import PedigreeFormContainer from '@/components/pedigrees/PedigreeFormContainer';

export default async function PedigreeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const pedigree = await getPedigreeById(params.id);

  if (!pedigree) {
    notFound();
  }

  return (
    <div className="flex-1 bg-white p-4 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-bold mb-4">詳細・編集 (Edit Pedigree: {pedigree.pedigreeId})</h2>
      <PedigreeFormContainer initialData={pedigree} />
    </div>
  );
}
