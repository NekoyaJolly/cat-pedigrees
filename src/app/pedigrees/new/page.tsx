import PedigreeFormContainer from '@/components/pedigrees/PedigreeFormContainer';

export default function NewPedigreePage() {
  return (
    <div className="flex-1 bg-white p-4 rounded-lg shadow border border-gray-200">
      <PedigreeFormContainer initialData={{}} />
    </div>
  );
}
