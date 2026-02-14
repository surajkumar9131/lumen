import { GoogleGenAI } from '@google/genai';
import { snippetsService } from './snippets.js';
import { booksService } from './books.js';

let ai: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export const aiService = {
  async summarize(
    userId: string,
    opts?: { bookId?: string; snippetIds?: string[] }
  ): Promise<{
    executiveSummary: string[];
    cognitiveConnections: Array<{ snippet: string; relatedBook: string; relatedQuote: string }>;
  }> {
    let snippets = opts?.snippetIds?.length
      ? await snippetsService.getMany(userId, opts.snippetIds)
      : await snippetsService.listByUser(userId, { bookId: opts?.bookId });

    if (opts?.bookId) {
      snippets = snippets.filter((s) => s.bookId === opts.bookId);
    }

    if (snippets.length === 0) {
      return {
        executiveSummary: ['No snippets available to summarize.'],
        cognitiveConnections: [],
      };
    }

    const bookIds = [...new Set(snippets.map((s) => s.bookId))];
    const books = await Promise.all(
      bookIds.map((id) => booksService.getById(userId, id))
    );
    const bookMap = new Map(
      books.filter((b): b is NonNullable<typeof b> => b != null).map((b) => [b.id, b])
    );

    const context = snippets
      .map((s) => {
        const book = bookMap.get(s.bookId);
        const src = book ? `${book.title} by ${book.author}` : s.bookId;
        return `[${src}]\n${s.text}`;
      })
      .join('\n\n---\n\n');

    const modelId = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
    const genAI = getGenAI();

    const prompt = `You are Lumen's "Mirror" synthesis engine. The user has captured the following snippets from their physical books. Provide:

1. **3-Point Executive Summary**: Three bullet points synthesizing the key themes from the user's specific captured content. Focus on what resonated with them based on what they chose to save.

2. **Cognitive Connections**: For each snippet, identify if it relates to another snippet from a different book. Format as: "This quote from [Book A] connects to [Book B]: [brief connection]". If no clear cross-book connection exists, omit it.

User's captured snippets:
---
${context}
---

Respond in JSON:
{
  "executiveSummary": ["point1", "point2", "point3"],
  "cognitiveConnections": [
    { "snippet": "excerpt from snippet", "relatedBook": "Book Title", "relatedQuote": "excerpt" }
  ]
}`;

    const response = await genAI.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    const text = response.text ?? '';
    const json = this.parseJsonResponse(text);
    return {
      executiveSummary: json.executiveSummary ?? ['Unable to generate summary.'],
      cognitiveConnections: json.cognitiveConnections ?? [],
    };
  },

  parseJsonResponse(text: string): {
    executiveSummary?: string[];
    cognitiveConnections?: Array<{ snippet: string; relatedBook: string; relatedQuote: string }>;
  } {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]) as {
        executiveSummary?: string[];
        cognitiveConnections?: Array<{ snippet: string; relatedBook: string; relatedQuote: string }>;
      };
    } catch {
      return {};
    }
  },
};
