import type { Pedigree } from '@prisma/client';

// 祖先14頭のナンバーを比較し、重複した文字列を返す。
export function getDuplicateIdentifiers(formData: Partial<Pedigree>): Set<string> {
  const fieldsToCheck: (keyof Pedigree)[] = [
    'fatherJCU',
    'motherJCU',
    'ffjcu',
    'fmjcu',
    'mfjcu',
    'mmjcu',
    'fffjcu',
    'ffmjcu',
    'fmfjcu',
    'fmmjcu',
    'mffjcu',
    'mfmjcu',
    'mmfjcu',
    'mmmjcu',
  ];

  const seen = new Set<string>();
  const duplicates = new Set<string>();

  fieldsToCheck.forEach((field) => {
    const value = formData[field];
    if (typeof value === 'string' && value.trim() !== '') {
      const normalizedValue = value.trim();
      if (seen.has(normalizedValue)) {
        duplicates.add(normalizedValue);
      } else {
        seen.add(normalizedValue);
      }
    }
  });

  return duplicates;
}
