import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { databaseConnectionSettings } from './database-connection';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  // 接続先はサーバー専用の設定から読み、待ち時間と接続数を制限する。
  if (!connectionString) throw new Error('データベースの接続設定がありません。');
  const pool = new Pool({ ...databaseConnectionSettings(connectionString, process.env.DATABASE_SSL_CA), max: Number(process.env.DATABASE_POOL_MAX || '5'), connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

