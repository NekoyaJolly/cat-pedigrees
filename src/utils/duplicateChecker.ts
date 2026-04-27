import { Pedigree } from '@prisma/client';

/**
 * Scans the form data for duplicate identifier fields (JCU numbers, pedigree IDs).
 * Returns a Set of duplicated strings.
 * If a field's value is in the Set, it means it appears more than once in the ancestry tree.
 */
export function getDuplicateIdentifiers(formData: Partial<Pedigree>): Set<string> {
  const fieldsToCheck: (keyof Pedigree)[] = [
    'pedigreeId',
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
