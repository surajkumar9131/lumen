import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/firebase.js';

const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';
/**
 * Verifies Firebase ID token from Authorization: Bearer <token> header.
 * Attaches decoded token to req.user for downstream use.
 * Set DISABLE_AUTH=true in .env to skip verification (dev only).
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (DISABLE_AUTH) {
    (req as Request & { user: { uid: string } }).user = { uid: 'dev-user' };
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = await auth.verifyIdToken(token);
    (req as Request & { user: { uid: string } }).user = { uid: decoded.uid };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
