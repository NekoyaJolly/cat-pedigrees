import { UserFacingError } from './user-error';
import type { Pedigree } from '@prisma/client';

// Accessから引き継ぐ保存項目を明示し、内部IDや日時の書き換えを防ぐ。
export const textFields = [
  'title', 'catName', 'catName2', 'eyeColor', 'birthDate', 'breederName',
  'ownerName', 'registrationDate', 'notes', 'notes2', 'otherNo',
  'fatherTitle', 'fatherCatName', 'fatherCatName2', 'fatherCoatColor',
  'fatherEyeColor', 'fatherJCU', 'fatherOtherCode', 'motherTitle',
  'motherCatName', 'motherCatName2', 'motherCoatColor', 'motherEyeColor',
  'motherJCU', 'motherOtherCode',
  'ffTitle', 'ffCatName', 'ffCatColor', 'ffjcu',
  'fmTitle', 'fmCatName', 'fmCatColor', 'fmjcu',
  'mfTitle', 'mfCatName', 'mfCatColor', 'mfjcu',
  'mmTitle', 'mmCatName', 'mmCatColor', 'mmjcu',
  'fffTitle', 'fffCatName', 'fffCatColor', 'fffjcu',
  'ffmTitle', 'ffmCatName', 'ffmCatColor', 'ffmjcu',
  'fmfTitle', 'fmfCatName', 'fmfCatColor', 'fmfjcu',
  'fmmTitle', 'fmmCatName', 'fmmCatColor', 'fmmjcu',
  'mffTitle', 'mffCatName', 'mffCatColor', 'mffjcu',
  'mfmTitle', 'mfmCatName', 'mfmCatColor', 'mfmjcu',
  'mmfTitle', 'mmfCatName', 'mmfCatColor', 'mmfjcu',
  'mmmTitle', 'mmmCatName', 'mmmCatColor', 'mmmjcu', 'oldCode',
] as const satisfies readonly (keyof Pedigree)[];

export const numberFields = [
  'breedCode', 'genderCode', 'coatColorCode', 'brotherCount', 'sisterCount',
] as const satisfies readonly (keyof Pedigree)[];

export type TextField = typeof textFields[number];
export type NumberField = typeof numberFields[number];
export type EditablePedigree = Pick<Pedigree, TextField | NumberField>;
export type PedigreeDraft = Partial<EditablePedigree>;
export type ParentRecord = Pedigree & { coatColor: { name: string } | null };

// 移行保留中の番号にも重ならないよう、添付Accessの最大番号まで予約する。
export const legacyReservedThrough = 704651;

export function todayInJapan(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' })
    .format(new Date()).replaceAll('-', '.');
}

export function normalizeDate(value: string): string | null {
  const match = value.trim().match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return [String(year), String(month).padStart(2, '0'), String(day).padStart(2, '0')].join('.');
}

export function validateDraft(input: PedigreeDraft, existing?: Pedigree): EditablePedigree {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new UserFacingError('入力内容を確認してください。');
  const data = {} as EditablePedigree;
  for (const field of textFields) {
    const value = input[field] === undefined ? existing?.[field] ?? null : input[field];
    if (value !== null && typeof value !== 'string') throw new UserFacingError('文字の入力内容を確認してください。');
    const clean = value?.trim() || null;
    const limit = field === 'notes' || field === 'notes2' ? 2000 : 500;
    if (clean && clean.length > limit) throw new UserFacingError('入力が長すぎる項目があります。短くして保存してください。');
    data[field] = clean;
  }
  for (const field of numberFields) {
    const value = input[field] === undefined ? existing?.[field] ?? null : input[field];
    if (value !== null && (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 2147483647)) {
      throw new UserFacingError('コードと頭数には、0以上の整数を入力してください。');
    }
    data[field] = value;
  }
  if (!data.catName && (!existing || existing.catName?.trim())) throw new UserFacingError('猫の名前を入力してください。');
  for (const field of ['birthDate', 'registrationDate'] as const) {
    const value = data[field];
    if (!value) continue;
    const normalized = normalizeDate(value);
    // 古い記録の不定な日付は、変更しない限りそのまま保持する。
    if (!normalized && value !== existing?.[field]) throw new UserFacingError('日付は「2026.10.18」のように入力してください。');
    data[field] = value === existing?.[field] ? value : normalized ?? value;
  }
  return data;
}

export function ancestryOf(record: Partial<Pedigree>): PedigreeDraft {
  const result: PedigreeDraft = {};
  for (const field of textFields) {
    if (/^(father|mother|ff|fm|mf|mm)/.test(field)) result[field] = record[field] ?? null;
  }
  return result;
}

export function siblingDraft(record: Partial<Pedigree>): PedigreeDraft {
  const result: PedigreeDraft = {};
  for (const field of textFields) result[field] = record[field] ?? null;
  for (const field of numberFields) result[field] = record[field] ?? null;
  // 父母・誕生日などを保持し、個体ごとに確認する名前と外部番号を空にする。
  return { ...result, catName: '', catName2: null, title: null, otherNo: null, oldCode: null };
}
