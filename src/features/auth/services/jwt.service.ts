import type { AccessTokenPayload } from "../types.ts";

import { calculateJwkThumbprint, exportJWK, importPKCS8, importSPKI, type JWK, jwtVerify, SignJWT } from "jose";

import { appConfig } from "@/src/config/index.ts";
import { AgoraError } from "@/src/lib/errors.ts";

/**
 * jose's import functions return either a generic Key object or Uint8Array depending on runtime.
 * We use `Awaited<ReturnType<typeof importPKCS8>>` to extract the exact strict inferred type without breaking compilation.
 */
type JoseKey = Awaited<ReturnType<typeof importPKCS8>>;

// Lazily load keys so they don't break the Next.js build step when env vars are missing in CI
let cachedPrivateKey: JoseKey | null = null;
let cachedPublicKey: JoseKey | null = null;
let cachedKeyId: string | null = null;

async function loadPrivateKey(): Promise<JoseKey> {
  if (!cachedPrivateKey) {
    cachedPrivateKey = await importPKCS8(appConfig.auth.jwtPrivateKey, "RS256");
  }
  return cachedPrivateKey;
}

async function loadPublicKey(): Promise<JoseKey> {
  if (!cachedPublicKey) {
    cachedPublicKey = await importSPKI(appConfig.auth.jwtPublicKey, "RS256");
  }
  return cachedPublicKey;
}

async function getKeyId(): Promise<string> {
  if (!cachedKeyId) {
    const publicKey = await loadPublicKey();
    const jwk = await exportJWK(publicKey);
    cachedKeyId = await calculateJwkThumbprint(jwk, "sha256");
  }
  return cachedKeyId;
}

export const JwtService = {
  /**
   * Signs a new access token payload using the private RSA key.
   *
   * @param payload The minimal user and session identifiers required.
   * @returns The signed JWT string.
   */

  async sign(payload: Omit<AccessTokenPayload, "iss" | "aud" | "exp" | "iat">): Promise<string> {
    const privateKey = await loadPrivateKey();
    const kid = await getKeyId();

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "RS256", kid }) // Essential: declares the algorithm and key id
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
      const publicKey = await loadPublicKey();
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
    const publicKey = await loadPublicKey();
    const jwk = await exportJWK(publicKey);
    const kid = await getKeyId();

    return {
      ...jwk,
      alg: "RS256",
      use: "sig",
      kid,
    };
  },
};
