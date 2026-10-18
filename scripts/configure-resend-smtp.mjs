import { pathToFileURL } from 'node:url';

// 対象を固定し、別のDBへ送信設定を適用しない。
export const PROJECT_REF = 'hnhhfcityestinsvcdfw';
const AUTH_CONFIG_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const REQUIRED_ENV = ['SUPABASE_ACCESS_TOKEN', 'RESEND_SMTP_PASSWORD', 'SMTP_FROM_EMAIL'];
const PRESERVED_FIELDS = ['site_url', 'uri_allow_list', 'mailer_autoconfirm', 'disable_signup'];

export class SetupError extends Error {}

function settings(env, current = {}) {
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(env.SMTP_FROM_EMAIL ?? '')) {
    throw new SetupError('SMTP_FROM_EMAILに送信元メールアドレスを指定してください。');
  }
  if (!/^re_[A-Za-z0-9_-]+$/.test(env.RESEND_SMTP_PASSWORD ?? '')) {
    throw new SetupError('RESEND_SMTP_PASSWORDにはResendの送信専用APIキーが必要です。');
  }
  if (current.smtp_host && current.smtp_host !== 'smtp.resend.com') {
    throw new SetupError('想定と異なるSMTPが設定済みのため停止しました。現在の設定を確認してください。');
  }
  const currentLimit = Number(current.rate_limit_email_sent);
  return {
    smtp_admin_email: env.SMTP_FROM_EMAIL,
    smtp_host: 'smtp.resend.com',
    smtp_port: '465',
    smtp_user: 'resend',
    smtp_pass: env.RESEND_SMTP_PASSWORD,
    smtp_sender_name: '血統書管理',
    // 既に30通より大きい上限を設定している場合は維持する。
    rate_limit_email_sent: Number.isSafeInteger(currentLimit) && currentLimit > 30 ? currentLimit : 30,
  };
}

async function requestConfig(fetchImpl, token, method, body) {
  let response;
  try {
    response = await fetchImpl(AUTH_CONFIG_URL, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    // 通信エラーの詳細や応答本文には秘密値が含まれる可能性があるため表示しない。
    throw new SetupError(`${method}の通信結果を確認できません。設定を読み直してから再実行してください。`);
  }
  if (!response.ok) {
    throw new SetupError(`${method}がHTTP ${response.status}で失敗しました。認証と管理権限を確認してください。`);
  }
  if (method === 'PATCH') return;
  try {
    const config = await response.json();
    if (!config || typeof config !== 'object' || Array.isArray(config) || !('smtp_host' in config)) {
      throw new Error();
    }
    return config;
  } catch {
    throw new SetupError('管理APIの設定を読み取れないため停止しました。');
  }
}

export async function configureSmtp({ apply = false, env = process.env, fetchImpl = fetch, write = console.log } = {}) {
  write(`対象: pedigrees (${PROJECT_REF})`);
  write('予定: smtp.resend.com / 465 / 送信者名「血統書管理」 / 上限は1時間30通以上');
  const missing = REQUIRED_ENV.filter((name) => !env[name]?.trim());
  if (missing.length) {
    write(`未設定: ${missing.join(', ')}`);
    write('秘密値をチャットやコマンドの引数へ貼らず、環境変数で渡してください。');
    return { status: 'blocked', missing };
  }
  // 入力検証は通信前に行う。確認モードでは管理APIも呼び出さない。
  settings(env);
  if (!apply) {
    write('入力は揃っています。--applyを付けると送信設定を保存します。');
    return { status: 'ready' };
  }
  const before = await requestConfig(fetchImpl, env.SUPABASE_ACCESS_TOKEN, 'GET');
  const payload = settings(env, before);
  await requestConfig(fetchImpl, env.SUPABASE_ACCESS_TOKEN, 'PATCH', payload);
  const after = await requestConfig(fetchImpl, env.SUPABASE_ACCESS_TOKEN, 'GET');
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'smtp_pass') continue;
    if (String(after[key]) !== String(value)) {
      throw new SetupError(`保存後の確認で${key}が一致しません。メール送信前に設定を確認してください。`);
    }
  }
  for (const key of PRESERVED_FIELDS) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      throw new SetupError(`保存後に${key}の変更を検出しました。管理画面の設定を確認してください。`);
    }
  }
  write('SMTPの接続先・送信元・送信上限を保存し、管理APIで読み直して確認しました。');
  write('パスワードの有効性とメールの受信・ログインは、本人による送信確認が必要です。');
  return { status: 'configured' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--check' && arg !== '--apply') || (args.includes('--check') && args.includes('--apply'))) {
    console.error('使い方: node scripts/configure-resend-smtp.mjs [--check | --apply]');
    process.exitCode = 2;
  } else {
    try {
      const result = await configureSmtp({ apply: args.includes('--apply') });
      if (result.status === 'blocked') process.exitCode = 2;
    } catch (error) {
      console.error(error instanceof SetupError ? error.message : '送信設定に失敗しました。秘密値は表示していません。');
      process.exitCode = 1;
    }
  }
}
