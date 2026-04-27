import { initialMockDb } from "./mockDb";
import type { DanangTvDataSource, DanangTvDb } from "./dataSource";

const STORAGE_KEY = "danangtv-mock-db";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function loadFromStorage(): DanangTvDb {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return clone(initialMockDb);
  return JSON.parse(raw);
}

export const mockDataSource: DanangTvDataSource = {
  async loadDb() {
    return loadFromStorage();
  },

  async saveDb(nextDb) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDb));
  },
};