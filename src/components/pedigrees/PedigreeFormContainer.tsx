'use client';

import React, { useEffect } from 'react';
import { Pedigree } from '@prisma/client';
import { usePedigreeStore } from '@/store/usePedigreeStore';
import PedigreeForm from './PedigreeForm';

export default function PedigreeFormContainer({ 
  initialData 
}: { 
  initialData?: Partial<Pedigree> 
}) {
  const setFormData = usePedigreeStore((state) => state.setFormData);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({}); // Reset for new form
    }
  }, [initialData, setFormData]);

  return <PedigreeForm />;
}
