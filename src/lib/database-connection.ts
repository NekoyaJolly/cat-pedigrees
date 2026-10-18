// CA文字列を指定したとき、接続URL側のSSL設定がCAを上書きすることを防ぐ。
export function databaseConnectionSettings(connectionString: string, ca?: string): { connectionString: string; ssl?: { ca: string; rejectUnauthorized: true } } {
  if (!ca?.trim()) return { connectionString };
  const url = new URL(connectionString);
  for (const key of ['sslmode','sslcert','sslkey','sslrootcert','uselibpqcompat']) url.searchParams.delete(key);
  return { connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true } };
}
