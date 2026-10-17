import { UserFacingError } from './user-error';
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SessionClaims {
  userId: string;
  email: string;
  audience: string;
  expiresAt: number;
}

// メールの本人確認後だけ発行する、署名付きのアプリ用セッション。
export function signSession(claims: SessionClaims, secret: string): string {
  if (secret.length < 32) throw new UserFacingError('ログインの設定が完了していません。');
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + signature;
}

export function verifySession(token: string, secret: string, audience: string, now = Date.now()): SessionClaims | null {
  if (secret.length < 32 || token.length > 4096) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = createHmac('sha256', secret).update(parts[0]).digest();
  const received = Buffer.from(parts[1], 'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[0], 'base64url').toString()) as SessionClaims;
    if (!claims || typeof claims !== 'object' || typeof claims.userId !== 'string' || !claims.userId ||
        typeof claims.email !== 'string' || !claims.email || claims.audience !== audience ||
        typeof claims.expiresAt !== 'number' || !Number.isFinite(claims.expiresAt) || claims.expiresAt <= now) return null;
    return claims;
  } catch {
    return null;
  }
}
