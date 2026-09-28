import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { users } from '../models/db';
import { CRA } from '../models/types';

const rawSecret = process.env.JWT_SECRET || process.env.SECRET_KEY;
if (process.env.NODE_ENV === 'production' && !rawSecret) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

export const SECRET_KEY = rawSecret || 'supersecretkeyforcraoutreachpipelinechangeinprod';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + SECRET_KEY).digest('hex');
}

export function createToken(userId: string): string {
  const payload = { sub: userId, exp: Date.now() + 30 * 24 * 3600 * 1000 };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET_KEY).update(str).digest('base64url');
  return `${str}.${sig}`;
}

export function verifyToken(token: string): string | null {
  try {
    if (!token || !token.trim()) return null;
    const cleanToken = token.trim();

    const parts = cleanToken.split('.');
    if (parts.length !== 2) return null;

    const [str, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(str).digest('base64url');

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(str, 'base64url').toString('utf-8'));
    if (!payload || !payload.sub) {
      return null;
    }

    if (payload.exp && typeof payload.exp === 'number' && Date.now() > payload.exp) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  const token = authHeader.slice(7);
  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
  const user = users.find((u) => u.id === userId);
  if (!user || !user.is_active) {
    return res.status(401).json({ detail: 'User not found or inactive' });
  }
  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as CRA;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ detail: 'Admin privileges required' });
  }
  next();
}
