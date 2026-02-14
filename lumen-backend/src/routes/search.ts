import { Router } from 'express';
import { searchService } from '../services/search.js';

export const searchRouter = Router();

/**
 * GET /api/search?q=keyword&limit=20
 * Global search across all user snippets (keyword + semantic/fuzzy)
 */
searchRouter.get('/', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const q = (req.query.q as string)?.trim();
    const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);

    if (!q) {
      return res.status(400).json({ error: 'Query parameter q required' });
    }

    const results = await searchService.search(userId, q, { limit });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});
