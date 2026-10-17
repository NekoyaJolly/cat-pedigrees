import { notFound } from 'next/navigation';
import { getPedigreeById } from '@/actions/pedigreeActions';
import CertificatePrint from '@/components/pedigrees/CertificatePrint';

export const metadata = { title: '印刷 | 血統書管理' };

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getPedigreeById(id);
  if (!record) notFound();
  return <CertificatePrint record={record} />;
}
