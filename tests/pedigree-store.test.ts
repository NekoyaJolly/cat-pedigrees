import assert from 'node:assert/strict';
import test from 'node:test';
import { createPedigreeStore, createPedigreeStoreCache } from '../src/store/usePedigreeStore';

test('呼び出した猫の状態は、別の空の新規登録やきょうだい画面で上書きされない', () => {
  // 最初は新規画面だった場合も、初期値ではなく最後に開いた猫を保持する。
  const page = createPedigreeStoreCache();
  const original = page.get('new', { registrationDate: '2026.10.18' });
  original.getState().setFormData({ id: 'record-1', pedigreeId: '123456', catName: '元の猫', notes2: '非表示の既存値' });
  original.getState().updateField('notes', '戻る前の未保存内容');
  original.getState().setDirty(true);

  const empty = createPedigreeStore({ registrationDate: '2026.10.18' });
  const sibling = page.get('sibling:record-1', { fatherCatName: '父猫', motherCatName: '母猫' });
  empty.getState().resetForm();
  sibling.getState().updateField('catName', '別の猫');

  assert.equal(original.getState().formData.id, 'record-1');
  assert.equal(original.getState().formData.catName, '元の猫');
  assert.equal(original.getState().formData.notes, '戻る前の未保存内容');
  assert.equal(original.getState().formData.notes2, '非表示の既存値');
  assert.equal(page.get('new', { registrationDate: '2026.10.18' }), original);
  assert.equal(original.getState().dirty, true);
  assert.equal(sibling.getState().dirty, false);
  assert.equal(empty.getState().formData.id, undefined);
  assert.equal(sibling.getState().formData.id, undefined);
});

test('別画面で遅れて完了した呼び出しは、現在の画面へ混ざらない', async () => {
  const previous = createPedigreeStore({ id: 'previous', catName: '前の画面' });
  const current = createPedigreeStore({ catName: '入力中の猫' });
  // 画面を切り替えた後に、前の画面の非同期処理が完了する状況を再現する。
  await Promise.resolve().then(() => previous.getState().setFormData({ id: 'loaded', catName: '呼び出した猫' }));
  assert.equal(previous.getState().formData.id, 'loaded');
  assert.equal(current.getState().formData.id, undefined);
  assert.equal(current.getState().formData.catName, '入力中の猫');
});
