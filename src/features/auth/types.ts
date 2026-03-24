import type { User } from "@/src/db/schema/index.ts";
import type { JWTPayload } from "jose";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export type LoginResponse = AuthTokens & {
  user: User;
};

export type AccessTokenPayload = JWTPayload & {
  sub: string; // User ID
  sid: string; // Session ID
  username: string;
  roles: string[];
};
