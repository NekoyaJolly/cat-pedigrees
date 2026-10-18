// 配置編集で指定された印字枠。固定用紙339×239mmの左上を原点とする。
export interface CertificatePosition { x: number; y: number; width: number; height: number; fontSize?: number }

export const certificateValuePositions = {
  breed: { x: 52, y: 51.9, width: 46, height: 5 },
  gender: { x: 52, y: 62.7, width: 25, height: 5 },
  birth: { x: 79.3, y: 62.9, width: 38, height: 5 },
  eye: { x: 52, y: 73, width: 26, height: 5 },
  color: { x: 79.3, y: 72.9, width: 40.6, height: 4.6 },
  name: { x: 131, y: 55, width: 83, height: 12 },
  number: { x: 164, y: 72, width: 45, height: 5, fontSize: 11 },
  owner: { x: 231, y: 51.1, width: 59, height: 5, fontSize: 11 },
  breeder: { x: 230.4, y: 61.7, width: 60, height: 5, fontSize: 11 },
  date: { x: 234.1, y: 72.7, width: 43, height: 5 },
  brother: { x: 274.2, y: 72.3, width: 10, height: 5 },
  sister: { x: 284.4, y: 72.3, width: 10, height: 5 },
  other: { x: 49.5, y: 214, width: 58, height: 5 },
} satisfies Record<string, CertificatePosition>;

export type CertificateValueField = keyof typeof certificateValuePositions;
export type CertificateAncestorField = 'title' | 'name' | 'name2' | 'color' | 'eye' | 'number' | 'other';
type Generation = 1 | 2 | 3;

// 父・父の父・父の父の父を正とし、同じ世代では行の縦位置だけをずらす。
const rows: Record<string, { generation: Generation; offset: number }> = {
  father: { generation: 1, offset: 0 }, mother: { generation: 1, offset: 53 },
  ff: { generation: 2, offset: 0 }, fm: { generation: 2, offset: 27 },
  mf: { generation: 2, offset: 53.5 }, mm: { generation: 2, offset: 80 },
  fff: { generation: 3, offset: 0 }, ffm: { generation: 3, offset: 13.3 },
  fmf: { generation: 3, offset: 26.6 }, fmm: { generation: 3, offset: 40 },
  mff: { generation: 3, offset: 53.3 }, mfm: { generation: 3, offset: 66.6 },
  mmf: { generation: 3, offset: 80 }, mmm: { generation: 3, offset: 93.3 },
};
const generationPositions: Record<Generation, Partial<Record<CertificateAncestorField, CertificatePosition>>> = {
  1: {
    title: { x: 50.3, y: 112.29, width: 58, height: 7 },
    name: { x: 50.6, y: 120.09, width: 58, height: 4.15 },
    name2: { x: 50.1, y: 125.44, width: 58, height: 4.15 },
    color: { x: 50, y: 131.28, width: 58, height: 4.15 },
    eye: { x: 50, y: 137.43, width: 58, height: 4.15 },
    number: { x: 50.3, y: 142.77, width: 58, height: 4.15 },
    other: { x: 83.3, y: 143.42, width: 36, height: 3.4 },
  },
  2: {
    title: { x: 141.8, y: 98.4, width: 56, height: 4.15 },
    name: { x: 141.5, y: 103.44, width: 56, height: 4.15 },
    color: { x: 142.1, y: 108.78, width: 56, height: 4.15 },
    number: { x: 141.8, y: 113.73, width: 56, height: 4.15 },
  },
  // 曾祖父母は変更のなかった基準見本の実測位置を固定する。
  3: {
    title: { x: 234.5, y: 95.49, width: 57, height: 3.45 },
    name: { x: 234.5, y: 98.93, width: 57, height: 3.45 },
    number: { x: 234.5, y: 102.38, width: 57, height: 3.23 },
  },
};

export function ancestorCertificatePosition(relation: string, field: CertificateAncestorField): CertificatePosition | undefined {
  const row = rows[relation];
  if (!row) return undefined;
  const position = generationPositions[row.generation][field];
  if (!position) return undefined;
  return { ...position, y: Math.round((position.y + row.offset) * 100) / 100 };
}

// 印字する名前・品種・色・氏名だけを単語の先頭大文字へ整える。登録値は変更しない。
export function formatCertificateText(value: string | null | undefined): string {
  return (value ?? '').replace(/\p{L}+(?:['’]\p{L}+)*/gu, word => word[0].toUpperCase() + word.slice(1).toLowerCase());
}
