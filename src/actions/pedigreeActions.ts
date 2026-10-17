'use server';

import { UserFacingError } from '@/lib/user-error';

import prisma from '@/lib/prisma';
import { Prisma, type Pedigree } from '@prisma/client';
import { requirePedigreeAccess } from '@/lib/access-session';
import { legacyReservedThrough, numberFields, textFields, validateDraft, type PedigreeDraft } from '@/lib/pedigree-fields';

export type PedigreeWithRelations = Prisma.PedigreeGetPayload<{ include: { breed: true; gender: true; coatColor: true } }>;
export interface SearchParams { q?: string; breed?: string; coatColor?: string; gender?: string; page?: string }
export interface SearchResult { items: PedigreeWithRelations[]; total: number; page: number; pageSize: number }
export interface SaveRequest { recordId?: string; expectedUpdatedAt?: string; requestId: string; draft: PedigreeDraft }
export type SaveResult = { ok: true; record: Pedigree } | { ok: false; message: string };

function masterFilter(value: string): { code: number } | { name: { contains: string; mode: 'insensitive' } } {
  const match = value.trim().match(/^(\d+)(?:\s|$)/);
  return match ? { code: Number(match[1]) } : { name: { contains: value.trim(), mode: 'insensitive' } };
}

export async function searchPedigreePage(params: SearchParams = {}): Promise<SearchResult> {
  await requirePedigreeAccess();
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 200) : '';
  const breed = typeof params.breed === 'string' ? params.breed.slice(0, 100) : '';
  const color = typeof params.coatColor === 'string' ? params.coatColor.slice(0, 100) : '';
  const gender = typeof params.gender === 'string' ? params.gender.slice(0, 100) : '';
  const where: Prisma.PedigreeWhereInput = {};
  if (q) where.OR = [
    { pedigreeId: { contains: q, mode: 'insensitive' } }, { catName: { contains: q, mode: 'insensitive' } },
    { catName2: { contains: q, mode: 'insensitive' } }, { ownerName: { contains: q, mode: 'insensitive' } },
    { breederName: { contains: q, mode: 'insensitive' } }, { notes: { contains: q, mode: 'insensitive' } },
    { notes2: { contains: q, mode: 'insensitive' } }, { fatherJCU: { contains: q, mode: 'insensitive' } },
    { motherJCU: { contains: q, mode: 'insensitive' } }, { birthDate: { contains: q, mode: 'insensitive' } },
  ];
  if (breed) where.breed = masterFilter(breed);
  if (color) where.coatColor = masterFilter(color);
  if (gender) where.gender = masterFilter(gender);
  const pageSize = 50;
  const requestedPage = Math.max(1, Math.min(100000, Number.parseInt(params.page || '1', 10) || 1));
  const total = await prisma.pedigree.count({ where });
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / pageSize)));
  const items = await prisma.pedigree.findMany({ where, include: { breed: true, gender: true, coatColor: true }, orderBy: [{ createdAt: 'desc' }, { pedigreeId: 'desc' }], skip: (page - 1) * pageSize, take: pageSize });
  return { items, total, page, pageSize };
}

export async function getPedigreeById(id: string) {
  await requirePedigreeAccess();
  if (typeof id !== 'string' || id.length > 100) return null;
  return prisma.pedigree.findUnique({ where: { id }, include: { breed: true, gender: true, coatColor: true } });
}

export async function getPedigreeByKey(key: string) {
  await requirePedigreeAccess();
  if (typeof key !== 'string' || !/^\d{1,10}$/.test(key.trim())) throw new UserFacingError('呼び出す猫の数字IDを入力してください。');
  return prisma.pedigree.findUnique({ where: { pedigreeId: String(Number(key.trim())) }, include: { breed: true, gender: true, coatColor: true } });
}

export async function getBreeds() {
  await requirePedigreeAccess();
  return prisma.breed.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
}
export async function getCoatColors() {
  await requirePedigreeAccess();
  return prisma.coatColor.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
}
export async function getGenders() {
  await requirePedigreeAccess();
  return prisma.gender.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
}

export async function savePedigree(input: SaveRequest): Promise<SaveResult> {
  await requirePedigreeAccess();
  if (process.env.PEDIGREE_WRITES_ENABLED !== '1') return { ok: false, message: '現在は閲覧用です。登録を開始する前に、管理者へ確認してください。' };
  try {
    if (!input || typeof input !== 'object' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) throw new UserFacingError('画面を開き直してから保存してください。');
    const existing = input.recordId ? await prisma.pedigree.findUnique({ where: { id: input.recordId } }) : null;
    if (input.recordId && !existing) throw new UserFacingError('保存する猫が見つかりません。画面を開き直してください。');
    const data = validateDraft(input.draft, existing ?? undefined);
    const [breed, color, gender] = await Promise.all([
      data.breedCode === null ? null : prisma.breed.findUnique({ where: { code: data.breedCode } }),
      data.coatColorCode === null ? null : prisma.coatColor.findUnique({ where: { code: data.coatColorCode } }),
      data.genderCode === null ? null : prisma.gender.findUnique({ where: { code: data.genderCode } }),
    ]);
    if ((data.breedCode !== null && !breed) || (data.coatColorCode !== null && !color) || (data.genderCode !== null && !gender)) throw new UserFacingError('猫種・色柄・性別のコードを確認してください。');
    if (existing) {
      const expected = input.expectedUpdatedAt ? new Date(input.expectedUpdatedAt) : null;
      if (!expected || !Number.isFinite(expected.getTime())) throw new UserFacingError('最新の内容を開いてから保存してください。');
      const record = await prisma.$transaction(async transaction => {
        const result = await transaction.pedigree.updateMany({ where: { id: existing.id, updatedAt: expected }, data });
        if (result.count !== 1) throw new UserFacingError('別の画面で内容が更新されています。最新の内容を確認してから保存してください。');
        return transaction.pedigree.findUniqueOrThrow({ where: { id: existing.id } });
      });
      return { ok: true, record };
    }
    const record = await prisma.$transaction(async transaction => {
      // 保存操作の再送と複数人の同時採番を、ひとつのトランザクションで扱う。
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(7294029)::text AS held`;
      const saved = await transaction.pedigree.findUnique({ where: { id: input.requestId } });
      if (saved) {
        const same = textFields.every(field => saved[field] === data[field]) && numberFields.every(field => saved[field] === data[field]);
        if (!same) throw new UserFacingError('この登録はすでに保存されています。一覧から保存した内容を確認してください。');
        return saved;
      }
      const [next] = await transaction.$queryRaw<Array<{ nextId: string }>>`
        SELECT (greatest(coalesce(max(pedigree_id::bigint), 0), ${legacyReservedThrough}) + 1)::text AS "nextId"
        FROM public.pedigrees WHERE pedigree_id ~ '^[0-9]{1,10}$'
      `;
      if (!next) throw new UserFacingError('登録番号を取得できませんでした。もう一度お試しください。');
      return transaction.pedigree.create({ data: { ...data, id: input.requestId, pedigreeId: next.nextId } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 10000, timeout: 20000 });
    return { ok: true, record };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) return { ok: false, message: '保存を完了できませんでした。入力内容を残したまま、もう一度お試しください。' };
    return { ok: false, message: error instanceof UserFacingError ? error.message : '保存を完了できませんでした。入力内容を残したまま、もう一度お試しください。' };
  }
}
