import { Router } from 'express';
import { foldersService } from '../services/folders.js';

export const foldersRouter = Router();

/**
 * POST /api/folders
 * Create a new folder
 */
foldersRouter.post('/', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const { name } = req.body as { name?: string };
    const folder = await foldersService.create(userId, name ?? 'Default');
    res.status(201).json(folder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

/**
 * GET /api/folders
 * List user's folders
 */
foldersRouter.get('/', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const folders = await foldersService.listByUser(userId);
    res.json(folders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list folders' });
  }
});
