import { getPedigreeById, getBreeds, getCoatColors, getGenders } from '@/actions/pedigreeActions';
import { notFound } from 'next/navigation';
import PedigreeFormContainer from '@/components/pedigrees/PedigreeFormContainer';

export default async function PedigreeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pedigree, breeds, colors, genders] = await Promise.all([getPedigreeById(id), getBreeds(), getCoatColors(), getGenders()]);

  if (!pedigree) {
    notFound();
  }

  return (
    <div className="min-w-0 flex-1">
      <PedigreeFormContainer key={id} initialData={pedigree} masters={{ breeds, colors, genders }} canWrite={process.env.PEDIGREE_WRITES_ENABLED === '1'} />
    </div>
  );
}
