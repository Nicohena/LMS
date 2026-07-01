// src/modules/academic/dashboard.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { getTeacherDashboardData, getStudentDashboardData, getAdminSchoolDashboardData } from './dashboard.service';

export async function getTeacherDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getTeacherDashboardData(req.user!.sub);
    res.status(200).json(data);
  } catch (err) { next(err); }
}
export async function getStudentDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getStudentDashboardData(req.user!.sub);
    res.status(200).json(data);
  } catch (err) { next(err); }
}
export async function getAdminSchoolDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getAdminSchoolDashboardData();
    res.status(200).json(data);
  } catch (err) { next(err); }
}
