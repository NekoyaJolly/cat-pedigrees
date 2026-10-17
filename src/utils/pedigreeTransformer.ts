import type { Pedigree } from '@prisma/client';

export type PedigreeNode = {
  relation: string;
  title: string | null;
  name: string | null;
  name2?: string | null;
  coatColor: string | null;
  eyeColor?: string | null;
  jcu: string | null;
  otherCode?: string | null;
  parents: PedigreeNode[];
};

export function transformToPedigreeTree(pedigree: Pedigree): PedigreeNode {
  // 曾祖父母の8頭。
  const fff: PedigreeNode = {
    relation: 'fff',
    title: pedigree.fffTitle,
    name: pedigree.fffCatName,
    coatColor: pedigree.fffCatColor,
    jcu: pedigree.fffjcu,
    parents: [],
  };
  const ffm: PedigreeNode = {
    relation: 'ffm',
    title: pedigree.ffmTitle,
    name: pedigree.ffmCatName,
    coatColor: pedigree.ffmCatColor,
    jcu: pedigree.ffmjcu,
    parents: [],
  };
  const fmf: PedigreeNode = {
    relation: 'fmf',
    title: pedigree.fmfTitle,
    name: pedigree.fmfCatName,
    coatColor: pedigree.fmfCatColor,
    jcu: pedigree.fmfjcu,
    parents: [],
  };
  const fmm: PedigreeNode = {
    relation: 'fmm',
    title: pedigree.fmmTitle,
    name: pedigree.fmmCatName,
    coatColor: pedigree.fmmCatColor,
    jcu: pedigree.fmmjcu,
    parents: [],
  };
  const mff: PedigreeNode = {
    relation: 'mff',
    title: pedigree.mffTitle,
    name: pedigree.mffCatName,
    coatColor: pedigree.mffCatColor,
    jcu: pedigree.mffjcu,
    parents: [],
  };
  const mfm: PedigreeNode = {
    relation: 'mfm',
    title: pedigree.mfmTitle,
    name: pedigree.mfmCatName,
    coatColor: pedigree.mfmCatColor,
    jcu: pedigree.mfmjcu,
    parents: [],
  };
  const mmf: PedigreeNode = {
    relation: 'mmf',
    title: pedigree.mmfTitle,
    name: pedigree.mmfCatName,
    coatColor: pedigree.mmfCatColor,
    jcu: pedigree.mmfjcu,
    parents: [],
  };
  const mmm: PedigreeNode = {
    relation: 'mmm',
    title: pedigree.mmmTitle,
    name: pedigree.mmmCatName,
    coatColor: pedigree.mmmCatColor,
    jcu: pedigree.mmmjcu,
    parents: [],
  };

  // 祖父母の4頭。
  const ff: PedigreeNode = {
    relation: 'ff',
    title: pedigree.ffTitle,
    name: pedigree.ffCatName,
    coatColor: pedigree.ffCatColor,
    jcu: pedigree.ffjcu,
    parents: [fff, ffm],
  };
  const fm: PedigreeNode = {
    relation: 'fm',
    title: pedigree.fmTitle,
    name: pedigree.fmCatName,
    coatColor: pedigree.fmCatColor,
    jcu: pedigree.fmjcu,
    parents: [fmf, fmm],
  };
  const mf: PedigreeNode = {
    relation: 'mf',
    title: pedigree.mfTitle,
    name: pedigree.mfCatName,
    coatColor: pedigree.mfCatColor,
    jcu: pedigree.mfjcu,
    parents: [mff, mfm],
  };
  const mm: PedigreeNode = {
    relation: 'mm',
    title: pedigree.mmTitle,
    name: pedigree.mmCatName,
    coatColor: pedigree.mmCatColor,
    jcu: pedigree.mmjcu,
    parents: [mmf, mmm],
  };

  // 父母の2頭。
  const father: PedigreeNode = {
    relation: 'father',
    title: pedigree.fatherTitle,
    name: pedigree.fatherCatName,
    name2: pedigree.fatherCatName2,
    coatColor: pedigree.fatherCoatColor,
    eyeColor: pedigree.fatherEyeColor,
    jcu: pedigree.fatherJCU,
    otherCode: pedigree.fatherOtherCode,
    parents: [ff, fm],
  };
  const mother: PedigreeNode = {
    relation: 'mother',
    title: pedigree.motherTitle,
    name: pedigree.motherCatName,
    name2: pedigree.motherCatName2,
    coatColor: pedigree.motherCoatColor,
    eyeColor: pedigree.motherEyeColor,
    jcu: pedigree.motherJCU,
    otherCode: pedigree.motherOtherCode,
    parents: [mf, mm],
  };

  // 本猫を根にして、3世代のツリーを返す。
  const self: PedigreeNode = {
    relation: 'self',
    title: pedigree.title,
    name: pedigree.catName,
    name2: pedigree.catName2,
    coatColor: pedigree.coatColorCode ? String(pedigree.coatColorCode) : null,
    eyeColor: pedigree.eyeColor,
    jcu: pedigree.pedigreeId,
    otherCode: pedigree.otherNo,
    parents: [father, mother],
  };

  return self;
}
