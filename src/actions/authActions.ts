'use server';

import { UserFacingError } from '@/lib/user-error';

import { redirect } from 'next/navigation';
import { allowedEmail, appOrigin, clearAccessSession, createAccessSession } from '@/lib/access-session';

export type LoginResult = { ok: true } | { ok: false; message: string };
interface VerifiedUser { id: string; email: string; email_confirmed_at?: string; confirmed_at?: string }
interface AuthResponse { access_token?: string; user?: VerifiedUser; id?: string; email?: string; email_confirmed_at?: string; confirmed_at?: string }

function authConfig(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';
  if (!url || !key) throw new UserFacingError('ログインの設定が完了していません。');
  if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) throw new UserFacingError('ログイン先の設定を確認してください。');
  return { url: url.replace(/\/$/, ''), key };
}

async function verifyAccessToken(token: string): Promise<void> {
  if (typeof token !== 'string' || token.length < 10 || token.length > 8192) throw new UserFacingError('確認用のリンクを開き直してください。');
  const config = authConfig();
  const response = await fetch(config.url + '/auth/v1/user', { headers: { apikey: config.key, Authorization: 'Bearer ' + token }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new UserFacingError('確認の有効期限が切れています。メールを送り直してください。');
  const user = await response.json() as VerifiedUser;
  if (typeof user.id !== 'string' || typeof user.email !== 'string' || !(user.email_confirmed_at || user.confirmed_at)) throw new UserFacingError('メールアドレスの確認が完了していません。');
  await createAccessSession(user);
}

export async function requestLoginEmail(email: string): Promise<LoginResult> {
  try {
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new UserFacingError('メールアドレスを確認してください。');
    const clean = email.trim().toLowerCase();
    if (!allowedEmail(clean)) throw new UserFacingError('このメールアドレスは利用登録されていません。');
    const config = authConfig();
    // 送信先と戻り先は、管理者が登録した設定に限定する。
    const url = new URL(config.url + '/auth/v1/otp');
    url.searchParams.set('redirect_to', appOrigin() + '/auth/callback');
    const response = await fetch(url, { method: 'POST', headers: { apikey: config.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: clean, create_user: true }), cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new UserFacingError(response.status === 429 ? '少し時間をおいてから、もう一度お試しください。' : 'メールを送信できませんでした。時間をおいてお試しください。');
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof UserFacingError ? error.message : 'メールを送信できませんでした。' };
  }
}

export async function verifyLoginCode(email: string, token: string): Promise<LoginResult> {
  try {
    if (typeof email !== 'string' || !allowedEmail(email) || typeof token !== 'string' || !/^\d{6,10}$/.test(token.trim())) throw new UserFacingError('メールアドレスと確認コードを確認してください。');
    const config = authConfig();
    const response = await fetch(config.url + '/auth/v1/verify', { method: 'POST', headers: { apikey: config.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase(), token: token.trim(), type: 'email' }), cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new UserFacingError('確認コードが違うか、有効期限が切れています。');
    const result = await response.json() as AuthResponse;
    if (!result.access_token) throw new UserFacingError('ログインを確認できませんでした。');
    await verifyAccessToken(result.access_token);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof UserFacingError ? error.message : 'ログインできませんでした。' };
  }
}

export async function completeLinkLogin(token: string): Promise<LoginResult> {
  try { await verifyAccessToken(token); return { ok: true }; }
  catch (error) { return { ok: false, message: error instanceof UserFacingError ? error.message : 'ログインできませんでした。' }; }
}

export async function logout(): Promise<void> {
  await clearAccessSession();
  redirect('/login');
}
