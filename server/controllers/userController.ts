import { Request, Response } from 'express';
import { users } from '../models/db';

export function getUsers(req: Request, res: Response) {
  const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
  return res.json(safeUsers);
}

export function updateUserTarget(req: Request, res: Response) {
  const target = parseInt(req.query.target as string, 10);
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ detail: 'CRA team member not found' });
  if (!isNaN(target)) user.monthly_jd_target = target;
  const { passwordHash, ...safe } = user;
  return res.json(safe);
}
