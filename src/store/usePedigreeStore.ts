import { create } from 'zustand';
import { Pedigree } from '@prisma/client';
import { AncestryRole, mapParentRecordToAncestryFields } from '@/utils/generationMapper';

interface PedigreeState {
  formData: Partial<Pedigree>;
  updateField: (field: keyof Pedigree, value: any) => void;
  setFormData: (data: Partial<Pedigree>) => void;
  mergeAncestryData: (parentRecord: Pedigree, role: AncestryRole) => void;
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
