import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signSession, verifySession } from '../src/lib/session-token';

const secret = '検証専用の十分に長い署名鍵です-0123456789abcdef';
const audience = 'https://fixture.example.test';
const claims = { userId: 'fixture-user', email: 'fixture@example.test', audience, expiresAt: 2000 };

test('署名・期限・接続先が一致するセッションだけを受け付ける', () => {
  const token = signSession(claims, secret);
  assert.deepEqual(verifySession(token, secret, audience, 1000), claims);
  assert.equal(verifySession(token, secret, audience, 2000), null);
  assert.equal(verifySession(token, secret, 'https://other.example.test', 1000), null);
  assert.equal(verifySession(token, secret + 'wrong', audience, 1000), null);
  assert.equal(verifySession(token + '.extra', secret, audience, 1000), null);
  const [body, signature] = token.split('.');
  assert.equal(verifySession(body.slice(0,-1) + 'A.' + signature, secret, audience, 1000), null);
});

test('未設定の鍵、不完全な本人情報、壊れた内容は拒否する', () => {
  assert.throws(() => signSession(claims, 'short'));
  assert.equal(verifySession('invalid', '', audience, 1000), null);
  assert.equal(verifySession(signSession({ ...claims, userId: '' }, secret), secret, audience, 1000), null);
  assert.equal(verifySession(signSession({ ...claims, expiresAt: NaN }, secret), secret, audience, 1000), null);
});
