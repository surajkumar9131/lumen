import { db, storage } from '../lib/firebase.js';
import { ocrService } from './ocr.js';
import { vectorService } from './vector.js';
import type { Snippet } from '../types/index.js';

const SNIPPETS_COLLECTION = 'snippets';

export const snippetsService = {
  async create(
    userId: string,
    params: {
      bookId: string;
      text?: string;
      imageBuffer?: Buffer;
      pageNumber?: number;
    }
  ): Promise<Snippet> {
    let text = params.text;
    if (!text && params.imageBuffer) {
      text = await ocrService.extractText(params.imageBuffer);
    }
    if (!text) {
      throw new Error('Could not extract or receive text');
    }

    const ref = db.collection(SNIPPETS_COLLECTION).doc();
    const snippet: Omit<Snippet, 'id'> & { id?: string } = {
      id: ref.id,
      userId,
      bookId: params.bookId,
      text,
      ...(params.pageNumber != null && { pageNumber: params.pageNumber }),
      createdAt: new Date().toISOString(),
    };

    await ref.set(snippet);

    // Index for vector search (async, non-blocking)
    vectorService.upsert(userId, ref.id, text).catch(console.error);

    return snippet as Snippet;
  },

  async listByUser(
    userId: string,
    opts?: { bookId?: string }
  ): Promise<Snippet[]> {
    let query = db
      .collection(SNIPPETS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (opts?.bookId) {
      query = query.where('bookId', '==', opts.bookId) as typeof query;
    }

    const snapshot = await query.get();
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Snippet));
  },

  async getById(userId: string, id: string): Promise<Snippet | null> {
    const ref = db.collection(SNIPPETS_COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (data.userId !== userId) return null;
    return { id: doc.id, ...data } as Snippet;
  },

  async getMany(userId: string, ids: string[]): Promise<Snippet[]> {
    if (ids.length === 0) return [];
    const chunks = ids.slice(0, 10); // Firestore 'in' limit
    const refs = chunks.map((id) => db.collection(SNIPPETS_COLLECTION).doc(id));
    const docs = await db.getAll(...refs);
    return docs
      .filter((d) => d.exists && d.data()?.userId === userId)
      .map((d) => ({ id: d.id, ...d.data() } as Snippet));
  },

  async update(
    userId: string,
    id: string,
    data: { text: string }
  ): Promise<Snippet | null> {
    const ref = db.collection(SNIPPETS_COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) return null;
    await ref.update({ text: data.text });
    const updated = (await ref.get()).data()!;
    vectorService.upsert(userId, id, data.text).catch(console.error);
    return { id, ...updated } as Snippet;
  },

  async delete(userId: string, id: string): Promise<boolean> {
    const ref = db.collection(SNIPPETS_COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) return false;
    await ref.delete();
    vectorService.delete(id).catch(console.error);
    return true;
  },
};
