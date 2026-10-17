// Accessと同じく「猫種2桁・色柄3桁・性別1桁-本猫ID」を組み立てる。
export function generateCatCompositeId(
  breedCode: number | null | undefined,
  coatColorCode: number | null | undefined,
  genderCode: number | null | undefined,
  pedigreeId: string | null | undefined
): string {
  const bCode = breedCode ? String(breedCode).padStart(2, '0') : '00';
  const cCode = coatColorCode ? String(coatColorCode).padStart(3, '0') : '000';
  const gCode = genderCode !== null && genderCode !== undefined ? String(genderCode).slice(0, 1) : '0';
  const pId = pedigreeId || 'UNKNOWN';

  return `${bCode}${cCode}${gCode}-${pId}`;
}
