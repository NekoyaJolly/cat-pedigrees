import pg from 'pg';

// デプロイ先から実際に接続し、読み取りだけでアプリ専用ロールと必要なテーブルを確認する。
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('データベースの接続設定がありません。');
let client;
let password = '';
try {
  try { password = decodeURIComponent(new URL(connectionString).password); }
  catch { throw new Error('データベースの接続設定の形式を確認してください。'); }
  client = new pg.Client({ connectionString, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
  await client.connect();
  await client.query('begin transaction read only');
  const result = await client.query(`select current_user as role,
    (select count(*) from public.pedigrees)::int as pedigrees,
    (select count(*) from public.breeds)::int as breeds,
    (select count(*) from public.coat_colors)::int as colors,
    (select count(*) from public.genders)::int as genders`);
  const counts = result.rows[0];
  if (counts.role !== 'pedigree_web_app' || counts.breeds === 0 || counts.colors === 0 || counts.genders === 0) {
    throw new Error('接続ロールまたは基本データを確認できませんでした。');
  }
  await client.query('rollback');
  console.log('DB接続確認完了:', JSON.stringify(counts));
} catch (error) {
  // 接続先やパスワードを含む例外を、そのままビルドログへ出さない。
  const message = error.message.replaceAll(password || '\u0000', '[非表示]').replace(/postgres(?:ql)?:\/\/\S+/g, '[接続先非表示]');
  console.error('DB接続確認に失敗しました:', error.code || '', message);
  process.exitCode = 1;
} finally {
  await client?.end().catch(() => {});
}
