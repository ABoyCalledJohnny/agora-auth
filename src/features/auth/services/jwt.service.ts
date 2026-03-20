import type { AccessTokenPayload } from "../types.ts";

import { exportJWK, importPKCS8, importSPKI, type JWK, jwtVerify, SignJWT } from "jose";

import { appConfig } from "@/src/config/index.ts";
import { AgoraError } from "@/src/lib/errors.ts";

const privateKey = await importPKCS8(appConfig.auth.jwtPrivateKey, "RS256");
const publicKey = await importSPKI(appConfig.auth.jwtPublicKey, "RS256");

export const JwtService = {
  /**
   * Signs a new access token payload using the private RSA key.
   *
   * @param payload The minimal user and session identifiers required.
   * @returns The signed JWT string.
   */
  async sign(payload: Omit<AccessTokenPayload, "iss" | "aud" | "exp" | "iat">): Promise<string> {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "RS256" }) // Essential: declares the algorithm
      .setIssuedAt()
      .setIssuer(appConfig.app.url) // Identifies who created it
      .setAudience(appConfig.app.url) // Identifies who it's meant for
      .setExpirationTime(appConfig.auth.accessTokenExpiry) // e.g. "15m"
      .sign(privateKey);
  },

  /**
   * Cryptographically verifies the access token utilizing the public RSA key.
   * Ensures the token is neither expired nor tampered with.
   *
   * @param token The raw JWT string.
   * @returns The decoded payload.
   */
  async verify(token: string): Promise<AccessTokenPayload> {
    try {
      // Verify
      const { payload } = await jwtVerify<AccessTokenPayload>(token, publicKey, {
        issuer: appConfig.app.url,
        audience: appConfig.app.url,
      });

      return payload;
    } catch (error) {
      if (error instanceof Error && "code" in error) {
        if (error.code === "ERR_JWT_EXPIRED") {
          throw new AgoraError("TOKEN_EXPIRED");
        }
      }
      throw new AgoraError("TOKEN_INVALID");
    }
  },
  /**
   * Utility for returning the public key or JSON Web Key Set (JWKS).
   * Needed for external services to verify your tokens.
   */
  async getPublicKey(): Promise<JWK> {
    const jwk = await exportJWK(publicKey);
    return {
      ...jwk,
      alg: "RS256",
      use: "sig",
    };
  },
};
