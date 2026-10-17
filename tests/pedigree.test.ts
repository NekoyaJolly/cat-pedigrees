import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ancestryOf, legacyReservedThrough, normalizeDate, numberFields, siblingDraft, textFields, validateDraft, type ParentRecord } from '../src/lib/pedigree-fields';
import { mapParentRecordToAncestryFields } from '../src/utils/generationMapper';
import { getDuplicateIdentifiers } from '../src/utils/duplicateChecker';
import { transformToPedigreeTree } from '../src/utils/pedigreeTransformer';

function fixture(): ParentRecord {
  return { ...validateDraft({ catName: 'PARENT', breedCode: 9, coatColorCode: 12, genderCode: 1 }), id: 'fixture-parent', pedigreeId: '507', createdAt: new Date(0), updatedAt: new Date(0), coatColor: { name: 'Cream Tabby' }, title: 'CH.', catName2: 'SECOND LINE', eyeColor: 'Gold', otherNo: 'OTHER', fatherCatName: 'GRANDFATHER', fatherCoatColor: 'Silver', fatherJCU: 'GRAND-F', motherCatName: 'GRANDMOTHER', motherJCU: 'GRAND-M', ffCatName: 'GREAT-FF', ffjcu: 'G-FF', fmCatName: 'GREAT-FM', fmjcu: 'G-FM', mfCatName: 'GREAT-MF', mfjcu: 'G-MF', mmCatName: 'GREAT-MM', mmjcu: 'G-MM', fffCatColor: '画面外の色柄', oldCode: '旧番号' };
}

test('保存対象は業務80項目のうち自動採番を除く79項目に限定する', () => {
  assert.equal(textFields.length + numberFields.length, 79);
  assert.equal(new Set([...textFields, ...numberFields]).size, 79);
  assert.equal(legacyReservedThrough, 704651);
  const data = validateDraft({ catName: ' NEW CAT ', birthDate: '2024/2/29', brotherCount: 0 });
  assert.equal(data.catName, 'NEW CAT');
  assert.equal(data.birthDate, '2024.02.29');
  assert.equal(data.brotherCount, 0);
  assert.throws(() => validateDraft({ catName: '' }));
  assert.throws(() => validateDraft({ catName: 'CAT', breedCode: 1.5 }));
  assert.throws(() => validateDraft({ catName: 'CAT', sisterCount: -1 }));
});

test('不正な新規日付は拒否し、既存の日付と画面外の項目は保持する', () => {
  assert.equal(normalizeDate('2023.02.29'), null);
  assert.equal(normalizeDate('2024-02-29'), '2024.02.29');
  assert.throws(() => validateDraft({ catName: 'CAT', birthDate: '2024.13.01' }));
  const existing = { ...fixture(), birthDate: '不詳', registrationDate: '2025.4.1' };
  const data = validateDraft({ ownerName: '新所有者' }, existing);
  assert.equal(data.birthDate, '不詳');
  assert.equal(data.registrationDate, '2025.4.1');
  assert.equal(data.fffCatColor, '画面外の色柄');
  assert.equal(data.oldCode, '旧番号');
  assert.throws(() => validateDraft({ birthDate: '変更後も不詳' }, existing));
});

test('父・母を呼び出すと3世代分をそれぞれ正しい位置へ繰り下げる', () => {
  const record = fixture();
  for (const role of ['father','mother'] as const) {
    const data = mapParentRecordToAncestryFields(record, role);
    assert.equal(data[role + 'CatName' as 'fatherCatName' | 'motherCatName'], 'PARENT');
    assert.equal(data[role + 'JCU' as 'fatherJCU' | 'motherJCU'], '090121-507');
    assert.equal(data[role + 'CoatColor' as 'fatherCoatColor' | 'motherCoatColor'], 'Cream Tabby');
    const pairs = role === 'father'
      ? [['ffCatName','GRANDFATHER'],['fmCatName','GRANDMOTHER'],['fffCatName','GREAT-FF'],['ffmCatName','GREAT-FM'],['fmfCatName','GREAT-MF'],['fmmCatName','GREAT-MM']]
      : [['mfCatName','GRANDFATHER'],['mmCatName','GRANDMOTHER'],['mffCatName','GREAT-FF'],['mfmCatName','GREAT-FM'],['mmfCatName','GREAT-MF'],['mmmCatName','GREAT-MM']];
    for (const [field, expected] of pairs) assert.equal(data[field as keyof typeof data], expected);
    assert.equal(data.id, undefined);
    assert.equal(data.pedigreeId, undefined);
  }
});

test('両親のコピーは世代を変えず、きょうだい登録では固有情報と保存済みIDを外す', () => {
  const record = fixture();
  assert.equal(ancestryOf(record).fatherCatName, 'GRANDFATHER');
  assert.equal(ancestryOf(record).catName, undefined);
  const sibling = siblingDraft(record);
  assert.equal(sibling.catName, '');
  assert.equal(sibling.otherNo, null);
  assert.equal(sibling.fatherJCU, 'GRAND-F');
  assert.equal(sibling.breedCode, 9);
  assert.equal('id' in sibling, false);
  assert.equal('pedigreeId' in sibling, false);
});

test('祖先ナンバーの重複を空欄を除いて検出し、ツリーに祖先14頭を含む', () => {
  const record = { ...fixture(), fatherJCU: ' DUP ', mfjcu: 'DUP', motherJCU: '' };
  assert.deepEqual([...getDuplicateIdentifiers(record)], ['DUP']);
  const tree = transformToPedigreeTree(record);
  assert.equal(tree.parents.length, 2);
  assert.equal(tree.parents[0].parents[0].name, 'GREAT-FF');
  assert.equal(tree.parents[0].parents[0].parents[0].relation, 'fff');
  const count = (node: typeof tree): number => 1 + node.parents.reduce((sum, child) => sum + count(child), 0);
  assert.equal(count(tree), 15);
});
