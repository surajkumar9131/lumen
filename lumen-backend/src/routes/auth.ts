import { Router } from 'express';
import { auth } from '../lib/firebase.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

/**
 * GET /api/auth/me
 * Returns current user info. Requires Authorization: Bearer <id_token>.
 */
authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const uid = (req as { user?: { uid: string } }).user?.uid;
    if (!uid) return res.status(401).send();

    const userRecord = await auth.getUser(uid);
    res.json({
      uid: userRecord.uid,
      email: userRecord.email ?? null,
      displayName: userRecord.displayName ?? null,
      photoURL: userRecord.photoURL ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});
