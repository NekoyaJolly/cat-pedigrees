import type { Pedigree } from '@prisma/client';
import type { ParentRecord } from '@/lib/pedigree-fields';
import { generateCatCompositeId } from './idGenerator';

export type AncestryRole = 'father' | 'mother';

// 呼び出した猫を父または母に配置し、その祖先も1世代ずつ繰り下げる。
export function mapParentRecordToAncestryFields(
  parentRecord: ParentRecord,
  role: AncestryRole
): Partial<Pedigree> {
  const mapped: Partial<Pedigree> = {};

  if (role === 'father') {
    // 呼び出した猫自身を父にする。
    mapped.fatherTitle = parentRecord.title;
    mapped.fatherCatName = parentRecord.catName;
    mapped.fatherCatName2 = parentRecord.catName2;
    // 色柄はマスターの名称を引き継ぐ。
    mapped.fatherCoatColor = parentRecord.coatColor?.name ?? null;
    mapped.fatherEyeColor = parentRecord.eyeColor;
    mapped.fatherJCU = generateCatCompositeId(parentRecord.breedCode, parentRecord.coatColorCode, parentRecord.genderCode, parentRecord.pedigreeId);
    mapped.fatherOtherCode = parentRecord.otherNo;

    // 父の両親を祖父母にする。
    mapped.ffTitle = parentRecord.fatherTitle;
    mapped.ffCatName = parentRecord.fatherCatName;
    mapped.ffCatColor = parentRecord.fatherCoatColor;
    mapped.ffjcu = parentRecord.fatherJCU;

    mapped.fmTitle = parentRecord.motherTitle;
    mapped.fmCatName = parentRecord.motherCatName;
    mapped.fmCatColor = parentRecord.motherCoatColor;
    mapped.fmjcu = parentRecord.motherJCU;

    // 父の祖父母を曾祖父母にする。
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
    // 呼び出した猫自身を母にする。
    mapped.motherTitle = parentRecord.title;
    mapped.motherCatName = parentRecord.catName;
    mapped.motherCatName2 = parentRecord.catName2;
    mapped.motherCoatColor = parentRecord.coatColor?.name ?? null;
    mapped.motherEyeColor = parentRecord.eyeColor;
    mapped.motherJCU = generateCatCompositeId(parentRecord.breedCode, parentRecord.coatColorCode, parentRecord.genderCode, parentRecord.pedigreeId);
    mapped.motherOtherCode = parentRecord.otherNo;

    // 母の両親を祖父母にする。
    mapped.mfTitle = parentRecord.fatherTitle;
    mapped.mfCatName = parentRecord.fatherCatName;
    mapped.mfCatColor = parentRecord.fatherCoatColor;
    mapped.mfjcu = parentRecord.fatherJCU;

    mapped.mmTitle = parentRecord.motherTitle;
    mapped.mmCatName = parentRecord.motherCatName;
    mapped.mmCatColor = parentRecord.motherCoatColor;
    mapped.mmjcu = parentRecord.motherJCU;

    // 母の祖父母を曾祖父母にする。
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
