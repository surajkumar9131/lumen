import { Router } from 'express';
import multer from 'multer';
import { snippetsService } from '../services/snippets.js';

const upload = multer({ storage: multer.memoryStorage() });
export const snippetsRouter = Router();

/**
 * POST /api/snippets
 * Create snippet from image (OCR) or raw text
 * Body: { bookId, text?, pageNumber? } + multipart image
 */
snippetsRouter.post('/', upload.single('image'), async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const { bookId, text, pageNumber } = req.body as {
      bookId?: string;
      text?: string;
      pageNumber?: string;
    };

    if (!bookId) {
      return res.status(400).json({ error: 'bookId required' });
    }

    const imageBuffer = req.file?.buffer;
    if (!text && !imageBuffer) {
      return res.status(400).json({ error: 'Either text or image required' });
    }

    const snippet = await snippetsService.create(userId, {
      bookId,
      text: text ?? undefined,
      imageBuffer: imageBuffer ?? undefined,
      pageNumber: pageNumber ? parseInt(pageNumber, 10) : undefined,
    });

    res.status(201).json(snippet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create snippet' });
  }
});

/**
 * GET /api/snippets?bookId=
 * List snippets (optionally filter by bookId)
 */
snippetsRouter.get('/', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const { bookId } = req.query;
    const snippets = await snippetsService.listByUser(userId, {
      bookId: typeof bookId === 'string' ? bookId : undefined,
    });
    res.json(snippets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list snippets' });
  }
});

/**
 * PATCH /api/snippets/:id
 * Update snippet text (e.g. OCR correction)
 */
snippetsRouter.patch('/:id', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const { text } = req.body as { text?: string };
    if (!text) return res.status(400).json({ error: 'text required' });

    const snippet = await snippetsService.update(userId, req.params.id, { text });
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
    res.json(snippet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update snippet' });
  }
});

/**
 * DELETE /api/snippets/:id
 */
snippetsRouter.delete('/:id', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const deleted = await snippetsService.delete(userId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Snippet not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete snippet' });
  }
});
