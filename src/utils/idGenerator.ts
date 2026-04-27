/**
 * Generates a composite ID for a cat for UI display.
 * Rules: breedCode(2 digits, zero-padded) + coatColorCode(3 digits, zero-padded) + genderCode(1 digit) + "-" + pedigreeId
 * 
 * @param breedCode - The breed code
 * @param coatColorCode - The coat color code
 * @param genderCode - The gender code
 * @param pedigreeId - The pedigree ID string
 * @returns The dynamically generated composite ID string
 */
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
