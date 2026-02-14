import { db, storage } from '../lib/firebase.js';
import { googleBooksService } from './google-books.js';
import type { Book } from '../types/index.js';

const BOOKS_COLLECTION = 'books';

export const booksService = {
  async createFromCover(userId: string, imageBuffer: Buffer, folderId?: string | null): Promise<Book> {
    // 1. Upload image to Firebase Storage
    const bucket = storage.bucket();
    const fileName = `covers/${userId}/${Date.now()}.jpg`;
    const file = bucket.file(fileName);
    await file.save(imageBuffer, {
      metadata: { contentType: 'image/jpeg' },
    });
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    // 2. Lookup metadata via Google Books (cover image → text extraction or use external API)
    // For MVP: use a placeholder; in production you'd use Vision API to read ISBN/title from image
    const metadata = await googleBooksService.lookupByImage(signedUrl) ?? {
      title: 'Unknown Book',
      author: 'Unknown Author',
      isbn: undefined,
      coverUrl: signedUrl,
    };

    return this.create(userId, {
      ...metadata,
      coverUrl: metadata.coverUrl ?? signedUrl,
    }, folderId);
  },

  async lookupAndCreate(
    userId: string,
    params: { isbn?: string; title?: string; author?: string; folderId?: string | null }
  ): Promise<Book | null> {
    const { folderId, ...lookupParams } = params;
    const metadata = await googleBooksService.lookup(lookupParams);
    if (!metadata) return null;
    return this.create(userId, metadata, folderId);
  },

  async create(
    userId: string,
    data: { title: string; author: string; isbn?: string; coverUrl?: string },
    folderId?: string | null
  ): Promise<Book> {
    const ref = db.collection(BOOKS_COLLECTION).doc();
    const resolvedFolderId = folderId && folderId !== 'default' ? folderId : 'default';
    const book: Omit<Book, 'id'> & { id?: string } = {
      id: ref.id,
      userId,
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      coverUrl: data.coverUrl,
      folderId: resolvedFolderId,
      createdAt: new Date().toISOString(),
    };
    await ref.set(book);
    return book as Book;
  },

  async listByUser(userId: string, folderId?: string | null): Promise<Book[]> {
    const snapshot = await db
      .collection(BOOKS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const books = snapshot.docs.map((d) => {
      const data = d.data();
      const fid = data.folderId ?? 'default';
      return { id: d.id, ...data, folderId: fid } as Book;
    });

    if (folderId === undefined || folderId === null) {
      return books; // All books for grouping
    }
    if (folderId === 'default') {
      return books.filter((b) => !b.folderId || b.folderId === 'default');
    }
    return books.filter((b) => b.folderId === folderId);
  },

  async getById(userId: string, id: string): Promise<Book | null> {
    const ref = db.collection(BOOKS_COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (data.userId !== userId) return null;
    return { id: doc.id, ...data } as Book;
  },
};
