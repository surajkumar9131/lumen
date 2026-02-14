import { Router } from 'express';
import { exportService } from '../services/export.js';

export const exportRouter = Router();

/**
 * GET /api/export?format=markdown|notion|obsidian&bookId=optional
 * Export snippets to Second Brain formats
 */
exportRouter.get('/', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const rawFormat = (req.query.format as string) ?? 'markdown';
    const format = rawFormat as 'markdown' | 'notion' | 'obsidian';
    const bookId = req.query.bookId as string | undefined;

    const validFormats = ['markdown', 'notion', 'obsidian'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({ error: `format must be one of: ${validFormats.join(', ')}` });
    }

    const result = await exportService.exportSnippets(userId, format, { bookId });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});
