import { db } from '../lib/firebase.js';
import { vectorService } from './vector.js';

export const searchService = {
  async search(
    userId: string,
    query: string,
    opts: { limit?: number } = {}
  ): Promise<{
    keyword: Array<{ id: string; text: string; bookId: string; score: number }>;
    semantic: Array<{ id: string; text: string; bookId: string; score: number }>;
  }> {
    const limit = opts.limit ?? 20;

    // 1. Keyword search (Firestore)
    const keywordResults = await this.keywordSearch(userId, query, limit);

    // 2. Semantic search (Pinecone)
    const semanticIds = await vectorService.search(userId, query, limit);
    const semanticResults = await this.fetchSnippetsByIds(userId, semanticIds);

    return { keyword: keywordResults, semantic: semanticResults };
  },

  async keywordSearch(
    userId: string,
    q: string,
    limit: number
  ): Promise<Array<{ id: string; text: string; bookId: string; score: number }>> {
    // Firestore doesn't support full-text search natively.
    // For MVP: fetch recent snippets and filter client-side, or use Algolia/Elastic.
    // Here we do a simple substring match on Firestore-fetched snippets.
    const snapshot = await db
      .collection('snippets')
      .where('userId', '==', userId)
      .limit(200)
      .get();

    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = snapshot.docs
      .map((d) => {
        const data = d.data();
        const text = (data.text as string) ?? '';
        const lower = text.toLowerCase();
        let score = 0;
        for (const t of terms) {
          if (lower.includes(t)) score += 1;
        }
        return { id: d.id, text, bookId: data.bookId, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  },

  async fetchSnippetsByIds(
    userId: string,
    items: Array<{ id: string; score: number }>
  ): Promise<Array<{ id: string; text: string; bookId: string; score: number }>> {
    if (items.length === 0) return [];

    const refs = items.map(({ id }) => db.collection('snippets').doc(id));
    const docs = await db.getAll(...refs);
    const map = new Map<string, { text: string; bookId: string }>();
    docs.forEach((d, i) => {
      if (d.exists && d.data()?.userId === userId) {
        const data = d.data()!;
        map.set(d.id, { text: data.text, bookId: data.bookId });
      }
    });

    return items
      .filter(({ id }) => map.has(id))
      .map(({ id, score }) => ({
        id,
        text: map.get(id)!.text,
        bookId: map.get(id)!.bookId,
        score,
      }));
  },
};
