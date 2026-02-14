/**
 * Google Books / OpenLibrary metadata lookup.
 * Fetches Title, Author, ISBN, Cover Art.
 */

interface BookMetadata {
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
}

export const googleBooksService = {
  async lookup(params: {
    isbn?: string;
    title?: string;
    author?: string;
  }): Promise<BookMetadata | null> {
    if (params.isbn) {
      return this.lookupByIsbn(params.isbn);
    }
    if (params.title || params.author) {
      return this.lookupByQuery(
        [params.title, params.author].filter(Boolean).join(' ')
      );
    }
    return null;
  },

  async lookupByIsbn(isbn: string): Promise<BookMetadata | null> {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`;
    const res = await fetch(url);
    const json = (await res.json()) as { items?: Array<{ volumeInfo: Record<string, unknown> }> };
    const item = json.items?.[0];
    if (!item?.volumeInfo) return null;
    return this.mapVolumeToMetadata(item.volumeInfo);
  },

  async lookupByQuery(query: string): Promise<BookMetadata | null> {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    const res = await fetch(url);
    const json = (await res.json()) as { items?: Array<{ volumeInfo: Record<string, unknown> }> };
    const item = json.items?.[0];
    if (!item?.volumeInfo) return null;
    return this.mapVolumeToMetadata(item.volumeInfo);
  },

  /**
   * Lookup by cover image URL. In production, use Vision API to extract
   * ISBN/title from image, then call lookupByIsbn or lookupByQuery.
   * For now returns null (caller should fallback).
   */
  async lookupByImage(_imageUrl: string): Promise<BookMetadata | null> {
    return null;
  },

  mapVolumeToMetadata(v: Record<string, unknown>): BookMetadata {
    const authors = v.authors as string[] | undefined;
    const author = Array.isArray(authors) ? authors.join(', ') : 'Unknown';
    const title = (v.title as string) ?? 'Unknown';
    const imageLinks = v.imageLinks as Record<string, string> | undefined;
    const coverUrl = imageLinks?.thumbnail?.replace('http://', 'https://');
    const identifiers = v.industryIdentifiers as Array<{ type: string; identifier: string }> | undefined;
    const isbn = identifiers?.find((i) => i.type === 'ISBN_13' || i.type === 'ISBN_10')?.identifier;
    return { title, author, isbn, coverUrl };
  },
};
