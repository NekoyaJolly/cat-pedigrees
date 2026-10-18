import type { TextField } from './pedigree-fields';

export type PedigreeFieldSize = 'id' | 'code' | 'gender' | 'count' | 'date' | 'eye' | 'name' | 'continuation' | 'person' | 'title' | 'ancestor-title' | 'color' | 'number' | 'notes';

// 実データの文字数に応じた表示幅を選ぶ。保存できる文字数は変更しない。
export function pedigreeFieldSize(field: TextField): PedigreeFieldSize {
  if (field === 'birthDate' || field === 'registrationDate') return 'date';
  if (field === 'eyeColor' || field.endsWith('EyeColor')) return 'eye';
  if (field === 'breederName' || field === 'ownerName') return 'person';
  if (field === 'notes' || field === 'notes2') return 'notes';
  if (field === 'title') return 'title';
  if (field.endsWith('Title')) return 'ancestor-title';
  if (field.endsWith('Name2')) return 'continuation';
  if (field.includes('Name')) return 'name';
  if (field.endsWith('CoatColor') || field.endsWith('CatColor')) return 'color';
  return 'number';
}
