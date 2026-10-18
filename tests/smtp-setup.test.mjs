import assert from 'node:assert/strict';
import test from 'node:test';
import { configureSmtp, PROJECT_REF } from '../scripts/configure-resend-smtp.mjs';

const env = {
  SUPABASE_ACCESS_TOKEN: 'sbp_fixture_management_secret',
  RESEND_SMTP_PASSWORD: 're_fixture_sending_secret',
  SMTP_FROM_EMAIL: 'no-reply@fixture.example',
};
const initialConfig = {
  smtp_host: '',
  rate_limit_email_sent: 2,
  site_url: 'https://pedigree.fixture.example',
  uri_allow_list: 'https://pedigree.fixture.example/auth/callback',
  mailer_autoconfirm: false,
  disable_signup: false,
};

test('認証不足と確認モードでは通信せず、秘密値を出力しない', async () => {
  const messages = [];
  const fetchImpl = async () => assert.fail('確認モードで通信してはいけない');
  const blocked = await configureSmtp({ apply: true, env: {}, fetchImpl, write: (message) => messages.push(message) });
  assert.equal(blocked.status, 'blocked');
  const ready = await configureSmtp({ env, fetchImpl, write: (message) => messages.push(message) });
  assert.equal(ready.status, 'ready');
  assert.ok(!messages.join('\n').includes(env.RESEND_SMTP_PASSWORD));
  assert.ok(!messages.join('\n').includes(env.SUPABASE_ACCESS_TOKEN));
});

test('対象プロジェクトのSMTP7項目だけを変更し、URLと認証設定を維持する', async () => {
  let config = { ...initialConfig };
  const methods = [];
  const messages = [];
  const fetchImpl = async (url, options) => {
    assert.equal(url, `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`);
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, `Bearer ${env.SUPABASE_ACCESS_TOKEN}`);
    methods.push(options.method);
    if (options.method === 'PATCH') {
      const payload = JSON.parse(options.body);
      assert.deepEqual(Object.keys(payload).sort(), [
        'smtp_admin_email', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_sender_name', 'rate_limit_email_sent',
      ].sort());
      assert.equal(payload.smtp_pass, env.RESEND_SMTP_PASSWORD);
      config = { ...config, ...payload };
    }
    return { ok: true, json: async () => ({ ...config, smtp_pass: '非表示' }) };
  };
  const result = await configureSmtp({ apply: true, env, fetchImpl, write: (message) => messages.push(message) });
  assert.equal(result.status, 'configured');
  assert.deepEqual(methods, ['GET', 'PATCH', 'GET']);
  assert.equal(config.rate_limit_email_sent, 30);
  assert.equal(config.site_url, initialConfig.site_url);
  assert.equal(config.uri_allow_list, initialConfig.uri_allow_list);
  assert.equal(config.mailer_autoconfirm, false);
  assert.ok(!messages.join('\n').includes(env.RESEND_SMTP_PASSWORD));
});

test('既に大きい送信上限は引き下げない', async () => {
  let config = { ...initialConfig, rate_limit_email_sent: 100 };
  const fetchImpl = async (_url, options) => {
    if (options.method === 'PATCH') config = { ...config, ...JSON.parse(options.body) };
    return { ok: true, json: async () => config };
  };
  await configureSmtp({ apply: true, env, fetchImpl, write: () => {} });
  assert.equal(config.rate_limit_email_sent, 100);
});

test('別SMTPの設定と権限不足では変更要求を出さない', async () => {
  for (const config of [{ ...initialConfig, smtp_host: 'smtp.other.example' }, null]) {
    const methods = [];
    const fetchImpl = async (_url, options) => {
      methods.push(options.method);
      return config ? { ok: true, json: async () => config } : { ok: false, status: 403 };
    };
    await assert.rejects(configureSmtp({ apply: true, env, fetchImpl, write: () => {} }));
    assert.deepEqual(methods, ['GET']);
  }
});

test('保存後に別項目の変更が見つかった場合は成功としない', async () => {
  let config = { ...initialConfig };
  const fetchImpl = async (_url, options) => {
    if (options.method === 'PATCH') config = { ...config, ...JSON.parse(options.body), mailer_autoconfirm: true };
    return { ok: true, json: async () => config };
  };
  await assert.rejects(configureSmtp({ apply: true, env, fetchImpl, write: () => {} }), /mailer_autoconfirm/);
});
