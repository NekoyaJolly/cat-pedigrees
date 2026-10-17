import { UserFacingError } from './user-error';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { signSession, verifySession, type SessionClaims } from './session-token';

export function appOrigin(): string {
  const value = process.env.APP_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
  if (!value) throw new UserFacingError('公開先の設定が完了していません。');
  const url = new URL(value);
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new UserFacingError('公開先の設定を確認してください。');
  return url.origin;
}

export function allowedEmail(email: string): boolean {
  const allowed = (process.env.PEDIGREE_ALLOWED_EMAILS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

function cookieName(): string {
  return appOrigin().startsWith('https://') ? '__Host-pedigree_session' : 'pedigree_session';
}

export const getAccessSession = cache(async (): Promise<SessionClaims | null> => {
  const secret = process.env.PEDIGREE_SESSION_SECRET || '';
  const token = (await cookies()).get(cookieName())?.value;
  if (!token) return null;
  const session = verifySession(token, secret, appOrigin());
  // 利用者一覧から外したメールアドレスは、セッションの期限内でも拒否する。
  return session && allowedEmail(session.email) ? session : null;
});

export async function requirePedigreeAccess(): Promise<SessionClaims> {
  const session = await getAccessSession();
  if (!session) redirect('/login');
  return session;
}

export async function createAccessSession(user: { id: string; email: string }): Promise<void> {
  if (!allowedEmail(user.email)) throw new UserFacingError('このメールアドレスは利用登録されていません。');
  const duration = 12 * 60 * 60;
  const token = signSession({ userId: user.id, email: user.email.toLowerCase(), audience: appOrigin(), expiresAt: Date.now() + duration * 1000 }, process.env.PEDIGREE_SESSION_SECRET || '');
  (await cookies()).set(cookieName(), token, { httpOnly: true, secure: appOrigin().startsWith('https://'), sameSite: 'lax', path: '/', maxAge: duration });
}

export async function clearAccessSession(): Promise<void> {
  // __Host-付きCookieは、削除時もSecureとPathを一致させる。
  (await cookies()).set(cookieName(), '', { httpOnly: true, secure: appOrigin().startsWith('https://'), sameSite: 'lax', path: '/', maxAge: 0, expires: new Date(0) });
}
