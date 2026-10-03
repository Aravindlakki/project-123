import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { users } from '../models/db';
import { CRA } from '../models/types';

export const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkeyforcraoutreachpipelinechangeinprod';

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

    if (cleanToken.startsWith('client_token_')) {
      const rest = cleanToken.replace('client_token_', '');
      // Match by exact ID or if rest starts with / contains ID
      const matched = users.find((u) => u.id === rest || rest.startsWith(u.id) || rest.includes(u.id));
      if (matched) return matched.id;
      // Match by email substring in token
      const emailMatch = users.find((u) => u.email && rest.toLowerCase().includes(u.email.toLowerCase()));
      if (emailMatch) return emailMatch.id;
      return null;
    }

    const parts = cleanToken.split('.');
    if (parts.length >= 2) {
      // If 3 parts (standard JWT header.payload.signature), payload is parts[1]. If 2 parts (payload.signature), payload is parts[0].
      const candidates = parts.length === 3 ? [parts[1], parts[0]] : [parts[0], parts[1]];
      for (const candidate of candidates) {
        try {
          const payload = JSON.parse(Buffer.from(candidate, 'base64url').toString('utf-8'));
          if (payload) {
            if (payload.sub) {
              const user = users.find((u) => u.id === payload.sub);
              if (user) return user.id;
            }
            if (payload.email) {
              const cleanEmail = String(payload.email).toLowerCase();
              const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
              if (user) return user.id;

              // Dynamically register the authenticated user profile so /auth/me returns their correct identity
              const nameParts = cleanEmail.split('@')[0].split('.');
              const formattedName = nameParts.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
              const newUser: CRA = {
                id: payload.sub || `usr_${cleanEmail.replace(/[^a-z0-9]/gi, '_')}`,
                name: payload.user_metadata?.name || formattedName || 'Team Member',
                email: cleanEmail,
                passwordHash: hashPassword('Password123!'),
                role: cleanEmail.includes('admin') ? 'admin' : 'cra',
                emp_id: `PM-${Math.floor(100 + Math.random() * 900)}`,
                domain: 'Candidate Outreach & IT Sourcing',
                designation: cleanEmail.includes('admin') ? 'Administrator' : 'CRA Specialist',
                monthly_jd_target: 20,
                is_active: true,
                created_at: new Date().toISOString(),
              };
              users.push(newUser);
              return newUser.id;
            }
          }
        } catch (_) {}
      }
    }

    return null;
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
