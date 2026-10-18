import { createStore } from 'zustand/vanilla';
import type { Pedigree } from '@prisma/client';
import type { ParentRecord } from '@/lib/pedigree-fields';
import { AncestryRole, mapParentRecordToAncestryFields } from '@/utils/generationMapper';

interface PedigreeState {
  formData: Partial<Pedigree>;
  dirty: boolean;
  setDirty: (value: boolean) => void;
  updateField: <K extends keyof Pedigree>(field: K, value: Pedigree[K]) => void;
  setFormData: (data: Partial<Pedigree>) => void;
  mergeAncestryData: (parentRecord: ParentRecord, role: AncestryRole) => void;
  resetForm: () => void;
}

const initialFormState: Partial<Pedigree> = {};

// 戻る操作で保持される画面同士が、同じ入力状態を上書きしないようにする。
export const createPedigreeStore = (initialData: Partial<Pedigree> = {}) => createStore<PedigreeState>((set) => ({
  formData: initialData,
  dirty: false,
  setDirty: (value) => set({ dirty: value }),
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

export type PedigreeStore = ReturnType<typeof createPedigreeStore>;

// 同じ新規ページ内の下書きも分け、履歴で戻った下書きは初期値へ戻さない。
export function createPedigreeStoreCache() {
  const stores = new Map<string, PedigreeStore>();
  return {
    get(key: string, initialData: Partial<Pedigree>): PedigreeStore {
      const cached = stores.get(key);
      if (cached) return cached;
      const store = createPedigreeStore(initialData);
      stores.set(key, store);
      return store;
    },
  };
}
