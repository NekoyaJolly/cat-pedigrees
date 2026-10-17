import { redirect } from 'next/navigation';

export default async function EditAlias({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect('/pedigrees/' + encodeURIComponent(id));
}
