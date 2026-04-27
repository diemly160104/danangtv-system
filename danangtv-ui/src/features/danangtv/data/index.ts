import { mockDataSource } from "./mockDataSource";
import { apiDataSource } from "./apiDataSource";

export const danangTvDataSource =
  import.meta.env.VITE_DANANGTV_DATA_MODE === "api"
    ? apiDataSource
    : mockDataSource;