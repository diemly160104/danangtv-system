import type { SessionUser } from "../../types";
import { apiRequest } from "./http";
import { danangTvApiEndpoints } from "./endpoints";

type LoginResponse = {
  ok: true;
  user: SessionUser;
};

export async function loginUser(args: {
  username: string;
  password: string;
}) {
  return apiRequest<LoginResponse>(danangTvApiEndpoints.authLogin, {
    method: "POST",
    body: JSON.stringify(args),
  });
}