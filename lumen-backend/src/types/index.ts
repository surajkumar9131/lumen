export interface Folder {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  folderId?: string | null;
  createdAt: string;
}

export interface Snippet {
  id: string;
  userId: string;
  bookId: string;
  text: string;
  pageNumber?: number;
  embedding?: number[];
  createdAt: string;
}

export interface ExportFormat {
  markdown: string;
  notion?: string;
  obsidian?: string;
}
