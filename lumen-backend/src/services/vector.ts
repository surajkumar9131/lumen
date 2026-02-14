/**
 * Pinecone vector index for semantic/fuzzy search.
 * Embeds snippet text and stores for similarity search.
 */

// Embedding dimension for Gemini text-embedding-004
const EMBED_DIM = 768;

async function getPinecone(): Promise<{ indexName: string; client: { index: (name: string) => unknown } | null }> {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME ?? 'lumen-snippets';
  if (!apiKey) return { indexName, client: null };
  const { Pinecone } = await import('@pinecone-database/pinecone');
  const client = new Pinecone({ apiKey }) as { index: (name: string) => unknown };
  return { indexName, client };
}

async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Array(EMBED_DIM).fill(0);
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export const vectorService = {
  async upsert(userId: string, snippetId: string, text: string): Promise<void> {
    const { client, indexName } = await getPinecone();
    if (!client) return;

    const values = await embed(text);
    const index = client.index(indexName);
    await (index as { upsert: (v: unknown) => Promise<unknown> }).upsert([
      {
        id: snippetId,
        values,
        metadata: { userId, text: text.slice(0, 1000) },
      },
    ]);
  },

  async delete(snippetId: string): Promise<void> {
    const { client, indexName } = await getPinecone();
    if (!client) return;
    const index = client.index(indexName) as { deleteOne: (id: string) => Promise<unknown> };
    await index.deleteOne(snippetId);
  },

  async search(userId: string, query: string, limit: number): Promise<Array<{ id: string; score: number }>> {
    const { client, indexName } = await getPinecone();
    if (!client) return [];

    const values = await embed(query);
    const index = client.index(indexName) as {
      query: (q: { vector: number[]; topK: number; filter?: object; includeMetadata?: boolean }) => Promise<{ matches?: Array<{ id?: string; score?: number }> }>;
    };
    const result = await index.query({
      vector: values,
      topK: limit,
      filter: { userId: { $eq: userId } },
      includeMetadata: true,
    });

    return (result.matches ?? []).map((m) => ({
      id: m.id ?? '',
      score: m.score ?? 0,
    }));
  },
};
