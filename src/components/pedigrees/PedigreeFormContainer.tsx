'use client';

import type { Pedigree } from '@prisma/client';
import { useState } from 'react';
import { createPedigreeStoreCache } from '@/store/usePedigreeStore';
import PedigreeForm, { type PedigreeMasters } from './PedigreeForm';

export default function PedigreeFormContainer({ 
  initialData, masters, canWrite, formKey = initialData.id || 'new',
}: { 
  initialData: Partial<Pedigree>;
  masters: PedigreeMasters;
  canWrite: boolean;
  formKey?: string;
}) {
  // キャッシュはこのページだけに持ち、新規ときょうだいの下書きを別々に復元する。
  const [forms] = useState(createPedigreeStoreCache);
  const store = forms.get(formKey, initialData);
  return <PedigreeForm key={formKey} store={store} masters={masters} canWrite={canWrite} />;
}
