import { Router } from 'express';
import multer from 'multer';
import { booksService } from '../services/books.js';

const upload = multer({ storage: multer.memoryStorage() });
export const booksRouter = Router();

/**
 * POST /api/books
 * Create book from cover image - fetches metadata via Google Books/OpenLibrary
 */
booksRouter.post('/', upload.single('cover'), async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Cover image required' });
    }

    const folderId = (req.body.folderId as string) || undefined;
    const book = await booksService.createFromCover(userId, file.buffer, folderId || null);
    res.status(201).json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

/**
 * POST /api/books/lookup
 * Lookup book metadata by ISBN or title+author (no image)
 */
booksRouter.post('/lookup', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const { isbn, title, author, folderId } = req.body as { isbn?: string; title?: string; author?: string; folderId?: string | null };
    const book = await booksService.lookupAndCreate(userId, { isbn, title, author, folderId });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(201).json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to lookup book' });
  }
});

/**
 * GET /api/books
 * List user's books
 */
booksRouter.get('/', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const folderId = (req.query.folderId as string) || undefined;
    const books = await booksService.listByUser(userId, folderId ?? null);
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list books' });
  }
});

/**
 * GET /api/books/:id
 * Get single book
 */
booksRouter.get('/:id', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const book = await booksService.getById(userId, req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get book' });
  }
});
