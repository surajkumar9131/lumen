import { db } from '../lib/firebase.js';
import type { Folder } from '../types/index.js';

const FOLDERS_COLLECTION = 'folders';

export const foldersService = {
  async create(userId: string, name: string): Promise<Folder> {
    const ref = db.collection(FOLDERS_COLLECTION).doc();
    const folder: Omit<Folder, 'id'> & { id?: string } = {
      id: ref.id,
      userId,
      name: name.trim() || 'Default',
      createdAt: new Date().toISOString(),
    };
    await ref.set(folder);
    return folder as Folder;
  },

  async listByUser(userId: string): Promise<Folder[]> {
    const snapshot = await db
      .collection(FOLDERS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Folder));
  },

  async getById(userId: string, id: string): Promise<Folder | null> {
    const ref = db.collection(FOLDERS_COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (data.userId !== userId) return null;
    return { id: doc.id, ...data } as Folder;
  },
};
