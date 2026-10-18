import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ancestorCertificatePosition, formatCertificateText, type CertificateAncestorField } from '../src/utils/certificateLayout';

// 実データを触らず、表示用の整形と世代間の位置の対応を確認する。
test('印字する名前・品種・色は単語の先頭大文字になり、空欄や区切りを保持する', () => {
  assert.equal(formatCertificateText('TEST CAT OF SAMPLE'), 'Test Cat Of Sample');
  assert.equal(formatCertificateText('SCOTTISH FOLD'), 'Scottish Fold');
  assert.equal(formatCertificateText("NEKO’S BLUE-CREAM / SILVER TABBY"), 'Neko’s Blue-Cream / Silver Tabby');
  assert.equal(formatCertificateText('ÉTOILE 123'), 'Étoile 123');
  assert.equal(formatCertificateText(null), '');
});

test('父の全項目と母の全項目は同じ幅・横位置で53mmずつ対応する', () => {
  for (const field of ['title', 'name', 'name2', 'color', 'eye', 'number', 'other'] as const) {
    const father = ancestorCertificatePosition('father', field)!;
    const mother = ancestorCertificatePosition('mother', field)!;
    assert.deepEqual(mother, { ...father, y: Math.round((father.y + 53) * 100) / 100 });
  }
});

test('祖父母・曾祖父母は各世代の基準を保ち、対象外の項目を混ぜない', () => {
  const groups: Array<{ baseline: string; fields: CertificateAncestorField[]; offsets: Array<[string, number]> }> = [
    { baseline: 'ff', fields: ['title', 'name', 'color', 'number'], offsets: [['fm', 27], ['mf', 53.5], ['mm', 80]] },
    { baseline: 'fff', fields: ['title', 'name', 'number'], offsets: [['ffm', 13.3], ['fmf', 26.6], ['fmm', 40], ['mff', 53.3], ['mfm', 66.6], ['mmf', 80], ['mmm', 93.3]] },
  ];
  for (const group of groups) for (const [relation, offset] of group.offsets) for (const field of group.fields) {
    const baseline = ancestorCertificatePosition(group.baseline, field)!;
    assert.deepEqual(ancestorCertificatePosition(relation, field), { ...baseline, y: Math.round((baseline.y + offset) * 100) / 100 });
  }
  assert.equal(ancestorCertificatePosition('ff', 'name2'), undefined);
  assert.equal(ancestorCertificatePosition('fff', 'color'), undefined);
  assert.equal(ancestorCertificatePosition('self', 'name'), undefined);
});
