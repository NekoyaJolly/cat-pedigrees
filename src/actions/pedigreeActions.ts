'use server';

import prisma from '@/lib/prisma';
import { Pedigree, Prisma } from '@prisma/client';

export type PedigreeWithRelations = Prisma.PedigreeGetPayload<{
  include: { breed: true; gender: true; coatColor: true }
}>;

export interface SearchParams {
  q?: string;
  breed?: string;
  coatColor?: string;
  gender?: string;
}

export async function searchPedigrees(params: SearchParams = {}): Promise<PedigreeWithRelations[]> {
  const { q, breed, coatColor, gender } = params;
  
  const hasFilters = Boolean(q || breed || coatColor || gender);

  try {
    const whereClause: Prisma.PedigreeWhereInput = {};

    if (q) {
      whereClause.OR = [
        { pedigreeId: { contains: q, mode: 'insensitive' } },
        { catName: { contains: q, mode: 'insensitive' } },
        { ownerName: { contains: q, mode: 'insensitive' } },
        { breederName: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (breed) {
      const parsed = parseInt(breed, 10);
      whereClause.breed = !isNaN(parsed) 
        ? { OR: [{ code: parsed }, { name: { contains: breed, mode: 'insensitive' } }] }
        : { name: { contains: breed, mode: 'insensitive' } };
    }

    if (coatColor) {
      const parsed = parseInt(coatColor, 10);
      whereClause.coatColor = !isNaN(parsed)
        ? { OR: [{ code: parsed }, { name: { contains: coatColor, mode: 'insensitive' } }] }
        : { name: { contains: coatColor, mode: 'insensitive' } };
    }

    if (gender) {
      const parsed = parseInt(gender, 10);
      whereClause.gender = !isNaN(parsed)
        ? { OR: [{ code: parsed }, { name: { contains: gender, mode: 'insensitive' } }] }
        : { name: { contains: gender, mode: 'insensitive' } };
    }

    const pedigrees = await prisma.pedigree.findMany({
      where: whereClause,
      include: {
        breed: true,
        gender: true,
        coatColor: true,
      },
      orderBy: { createdAt: 'desc' },
      take: hasFilters ? 5000 : 500, // If filtering, allow up to 5000 results
    });
    return pedigrees;
  } catch (error) {
    console.error('Failed to search pedigrees:', error);
    throw new Error('Failed to search pedigrees');
  }
}

export async function getPedigreeById(id: string) {
  try {
    const pedigree = await prisma.pedigree.findUnique({
      where: { id },
    });
    return pedigree;
  } catch (error) {
    console.error('Failed to get pedigree by id:', error);
    throw new Error('Failed to fetch pedigree');
  }
}

export async function getPedigreeByJcu(pedigreeId: string) {
  try {
    if (!pedigreeId) return null;
    const pedigree = await prisma.pedigree.findUnique({
      where: { pedigreeId },
    });
    return pedigree;
  } catch (error) {
    console.error('Failed to get pedigree by jcu:', error);
    throw new Error('Failed to fetch pedigree by JCU');
  }
}

export async function getBreeds() {
  try {
    return await prisma.breed.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  } catch (error) {
    console.error('Failed to get breeds:', error);
    return [];
  }
}

export async function getCoatColors() {
  try {
    return await prisma.coatColor.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  } catch (error) {
    console.error('Failed to get coat colors:', error);
    return [];
  }
}

export async function getGenders() {
  try {
    return await prisma.gender.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  } catch (error) {
    console.error('Failed to get genders:', error);
    return [];
  }
}
