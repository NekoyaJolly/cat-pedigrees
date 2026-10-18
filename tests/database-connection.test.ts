import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { databaseConnectionSettings } from '../src/lib/database-connection';

// ドライバーがURLを解析した後にも、指定したCAと証明書検証が残ることを確認する。
test('指定したCAがSSLのURLパラメーターで失われず、検証も有効のままになる', () => {
  const ca = '検証用のCA文字列';
  const settings = databaseConnectionSettings('postgresql://user:password@example.test/db?sslmode=disable&sslrootcert=missing.pem&application_name=pedigree',ca);
  const client = new pg.Client(settings);
  assert.ok('connectionParameters' in client);
  const parameters = client.connectionParameters;
  assert.ok(parameters && typeof parameters === 'object' && 'ssl' in parameters);
  const ssl = parameters.ssl;
  assert.ok(ssl && typeof ssl === 'object' && 'ca' in ssl && 'rejectUnauthorized' in ssl);
  assert.equal(ssl.ca,ca);
  assert.equal(ssl.rejectUnauthorized,true);
  assert.equal(new URL(settings.connectionString).searchParams.get('application_name'),'pedigree');
});

test('CAを指定しないローカル接続の設定はそのまま保持する', () => {
  const connectionString = 'postgresql://postgres:postgres@127.0.0.1:55432/postgres';
  assert.deepEqual(databaseConnectionSettings(connectionString),{ connectionString });
});
