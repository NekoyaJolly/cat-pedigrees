import PedigreeFormContainer from '@/components/pedigrees/PedigreeFormContainer';
import { getBreeds, getCoatColors, getGenders, getPedigreeById } from '@/actions/pedigreeActions';
import { siblingDraft, todayInJapan } from '@/lib/pedigree-fields';
import { notFound } from 'next/navigation';

export default async function NewPedigreePage({ searchParams }: { searchParams: Promise<{ sibling?: string }> }) {
  const { sibling } = await searchParams;
  const [breeds, colors, genders, source] = await Promise.all([getBreeds(), getCoatColors(), getGenders(), sibling ? getPedigreeById(sibling) : null]);
  if (sibling && !source) notFound();
  const initialData = source ? siblingDraft(source) : { registrationDate: todayInJapan() };
  return (
    <div className="min-w-0 flex-1">
      <PedigreeFormContainer key={sibling || 'new'} initialData={initialData} masters={{ breeds, colors, genders }} canWrite={process.env.PEDIGREE_WRITES_ENABLED === '1'} />
    </div>
  );
}
