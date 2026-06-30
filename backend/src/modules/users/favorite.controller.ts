// src/modules/users/favorite.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

function paramId(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v || '');
}

export async function getFavoritesController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            creator: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ data: favorites });
  } catch (err) { next(err); }
}

export async function addFavoriteController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const courseId = paramId(req, 'courseId');

    const favorite = await prisma.favorite.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId },
    });
    res.status(201).json({ message: 'Added to favorites.', favorite });
  } catch (err) { next(err); }
}

export async function removeFavoriteController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const courseId = paramId(req, 'courseId');

    await prisma.favorite.deleteMany({ where: { userId, courseId } });
    res.status(200).json({ message: 'Removed from favorites.' });
  } catch (err) { next(err); }
}
