'use server';

import prisma from '@/lib/prisma';
import { Pedigree, Prisma } from '@prisma/client';

export type PedigreeWithRelations = Prisma.PedigreeGetPayload<{
  include: { breed: true; gender: true; coatColor: true }
}>;

export async function searchPedigrees(query: string = ''): Promise<PedigreeWithRelations[]> {
  try {
    const pedigrees = await prisma.pedigree.findMany({
      where: query
        ? {
            OR: [
              { pedigreeId: { contains: query, mode: 'insensitive' } },
              { catName: { contains: query, mode: 'insensitive' } },
              { ownerName: { contains: query, mode: 'insensitive' } },
              { breederName: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        breed: true,
        gender: true,
        coatColor: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Increased limit for table viewing
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
