import { snippetsService } from './snippets.js';
import { booksService } from './books.js';

export const exportService = {
  async exportSnippets(
    userId: string,
    format: 'markdown' | 'notion' | 'obsidian',
    opts?: { bookId?: string }
  ): Promise<{ content: string; format: string }> {
    const snippets = await snippetsService.listByUser(userId, {
      bookId: opts?.bookId,
    });

    const bookIds = [...new Set(snippets.map((s) => s.bookId))];
    const books = await Promise.all(
      bookIds.map((id) => booksService.getById(userId, id))
    );
    const bookMap = new Map(
      books.filter((b): b is NonNullable<typeof b> => b != null).map((b) => [b.id, b])
    );

    const content = this.formatSnippets(snippets, bookMap, format);
    return { content, format };
  },

  formatSnippets(
    snippets: Array<{ id: string; text: string; bookId: string; pageNumber?: number }>,
    bookMap: Map<string, { title: string; author: string }>,
    format: 'markdown' | 'notion' | 'obsidian'
  ): string {
    const lines: string[] = [];
    for (const s of snippets) {
      const book = bookMap.get(s.bookId);
      const meta = book
        ? `${book.title} — ${book.author}`
        : s.bookId;
      const pageInfo = s.pageNumber != null ? ` (p. ${s.pageNumber})` : '';

      if (format === 'markdown') {
        lines.push(`> ${s.text}`);
        lines.push(`> — *${meta}${pageInfo}*`);
        lines.push('');
      } else if (format === 'obsidian') {
        lines.push(`> ${s.text}`);
        lines.push(`> — *${meta}${pageInfo}*`);
        lines.push('');
      } else if (format === 'notion') {
        lines.push(`"${s.text}" — ${meta}${pageInfo}`);
        lines.push('');
      }
    }
    return lines.join('\n').trim() || '(No snippets to export)';
  },
};
