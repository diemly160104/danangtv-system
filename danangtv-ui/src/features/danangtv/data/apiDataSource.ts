import type { DanangTvDataSource } from "./dataSource";
import { loadBootstrapData } from "./api/bootstrapApi";

export const apiDataSource: DanangTvDataSource = {
  async loadDb() {
    return loadBootstrapData();
  },

  async saveDb() {
    return;
  },
};