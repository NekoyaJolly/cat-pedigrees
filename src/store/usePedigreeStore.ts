import { create } from 'zustand';
import type { Pedigree } from '@prisma/client';
import type { ParentRecord } from '@/lib/pedigree-fields';
import { AncestryRole, mapParentRecordToAncestryFields } from '@/utils/generationMapper';

interface PedigreeState {
  formData: Partial<Pedigree>;
  updateField: <K extends keyof Pedigree>(field: K, value: Pedigree[K]) => void;
  setFormData: (data: Partial<Pedigree>) => void;
  mergeAncestryData: (parentRecord: ParentRecord, role: AncestryRole) => void;
  resetForm: () => void;
}

const initialFormState: Partial<Pedigree> = {};

export const usePedigreeStore = create<PedigreeState>((set) => ({
  formData: initialFormState,
  updateField: (field, value) => 
    set((state) => ({
      formData: {
        ...state.formData,
        [field]: value,
      },
    })),
  setFormData: (data) => set({ formData: data }),
  mergeAncestryData: (parentRecord, role) => 
    set((state) => {
      const ancestryFields = mapParentRecordToAncestryFields(parentRecord, role);
      return {
        formData: {
          ...state.formData,
          ...ancestryFields,
        },
      };
    }),
  resetForm: () => set({ formData: initialFormState }),
}));
