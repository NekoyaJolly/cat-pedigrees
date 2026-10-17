'use client';

import React, { useLayoutEffect, useState } from 'react';
import type { Pedigree } from '@prisma/client';
import { usePedigreeStore } from '@/store/usePedigreeStore';
import PedigreeForm, { type PedigreeMasters } from './PedigreeForm';

export default function PedigreeFormContainer({ 
  initialData, masters, canWrite,
}: { 
  initialData: Partial<Pedigree>;
  masters: PedigreeMasters;
  canWrite: boolean;
}) {
  const setFormData = usePedigreeStore((state) => state.setFormData);

  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    setFormData(initialData);
    setReady(true);
  }, [initialData, setFormData]);

  return ready ? <PedigreeForm masters={masters} canWrite={canWrite} /> : <p role="status">血統情報を開いています…</p>;
}
