import type { DanangTvDb } from "../dataSource";
import { apiRequest } from "./http";
import { danangTvApiEndpoints } from "./endpoints";

export async function loadBootstrapData() {
  return apiRequest<DanangTvDb>(danangTvApiEndpoints.bootstrap, {
    method: "GET",
  });
}