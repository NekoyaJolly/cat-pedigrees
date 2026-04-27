import { Pedigree } from '@prisma/client';

export type AncestryRole = 'father' | 'mother';

/**
 * Maps a fetched parent record (Pedigree) into the ancestry fields of the form.
 * This shifts the generation of the fetched record down by 1 relative to the current cat.
 */
export function mapParentRecordToAncestryFields(
  parentRecord: Pedigree,
  role: AncestryRole
): Partial<Pedigree> {
  const mapped: Partial<Pedigree> = {};

  if (role === 'father') {
    // Gen 1: The fetched record itself becomes the Father
    mapped.fatherTitle = parentRecord.title;
    mapped.fatherCatName = parentRecord.catName;
    mapped.fatherCatName2 = parentRecord.catName2;
    // Assuming coatColorCode might be used if actual string color isn't available
    mapped.fatherCoatColor = parentRecord.coatColorCode ? String(parentRecord.coatColorCode) : null;
    mapped.fatherEyeColor = parentRecord.eyeColor;
    mapped.fatherJCU = parentRecord.pedigreeId;
    mapped.fatherOtherCode = parentRecord.otherNo;

    // Gen 2: Father's parents become Paternal Grandparents (FF, FM)
    mapped.ffTitle = parentRecord.fatherTitle;
    mapped.ffCatName = parentRecord.fatherCatName;
    mapped.ffCatColor = parentRecord.fatherCoatColor;
    mapped.ffjcu = parentRecord.fatherJCU;

    mapped.fmTitle = parentRecord.motherTitle;
    mapped.fmCatName = parentRecord.motherCatName;
    mapped.fmCatColor = parentRecord.motherCoatColor;
    mapped.fmjcu = parentRecord.motherJCU;

    // Gen 3: Father's grandparents become Paternal Great-Grandparents (FFF, FFM, FMF, FMM)
    mapped.fffTitle = parentRecord.ffTitle;
    mapped.fffCatName = parentRecord.ffCatName;
    mapped.fffCatColor = parentRecord.ffCatColor;
    mapped.fffjcu = parentRecord.ffjcu;

    mapped.ffmTitle = parentRecord.fmTitle;
    mapped.ffmCatName = parentRecord.fmCatName;
    mapped.ffmCatColor = parentRecord.fmCatColor;
    mapped.ffmjcu = parentRecord.fmjcu;

    mapped.fmfTitle = parentRecord.mfTitle;
    mapped.fmfCatName = parentRecord.mfCatName;
    mapped.fmfCatColor = parentRecord.mfCatColor;
    mapped.fmfjcu = parentRecord.mfjcu;

    mapped.fmmTitle = parentRecord.mmTitle;
    mapped.fmmCatName = parentRecord.mmCatName;
    mapped.fmmCatColor = parentRecord.mmCatColor;
    mapped.fmmjcu = parentRecord.mmjcu;
  } else if (role === 'mother') {
    // Gen 1: The fetched record itself becomes the Mother
    mapped.motherTitle = parentRecord.title;
    mapped.motherCatName = parentRecord.catName;
    mapped.motherCatName2 = parentRecord.catName2;
    mapped.motherCoatColor = parentRecord.coatColorCode ? String(parentRecord.coatColorCode) : null; 
    mapped.motherEyeColor = parentRecord.eyeColor;
    mapped.motherJCU = parentRecord.pedigreeId;
    mapped.motherOtherCode = parentRecord.otherNo;

    // Gen 2: Mother's parents become Maternal Grandparents (MF, MM)
    mapped.mfTitle = parentRecord.fatherTitle;
    mapped.mfCatName = parentRecord.fatherCatName;
    mapped.mfCatColor = parentRecord.fatherCoatColor;
    mapped.mfjcu = parentRecord.fatherJCU;

    mapped.mmTitle = parentRecord.motherTitle;
    mapped.mmCatName = parentRecord.motherCatName;
    mapped.mmCatColor = parentRecord.motherCoatColor;
    mapped.mmjcu = parentRecord.motherJCU;

    // Gen 3: Mother's grandparents become Maternal Great-Grandparents (MFF, MFM, MMF, MMM)
    mapped.mffTitle = parentRecord.ffTitle;
    mapped.mffCatName = parentRecord.ffCatName;
    mapped.mffCatColor = parentRecord.ffCatColor;
    mapped.mffjcu = parentRecord.ffjcu;

    mapped.mfmTitle = parentRecord.fmTitle;
    mapped.mfmCatName = parentRecord.fmCatName;
    mapped.mfmCatColor = parentRecord.fmCatColor;
    mapped.mfmjcu = parentRecord.fmjcu;

    mapped.mmfTitle = parentRecord.mfTitle;
    mapped.mmfCatName = parentRecord.mfCatName;
    mapped.mmfCatColor = parentRecord.mfCatColor;
    mapped.mmfjcu = parentRecord.mfjcu;

    mapped.mmmTitle = parentRecord.mmTitle;
    mapped.mmmCatName = parentRecord.mmCatName;
    mapped.mmmCatColor = parentRecord.mmCatColor;
    mapped.mmmjcu = parentRecord.mmjcu;
  }

  return mapped;
}
