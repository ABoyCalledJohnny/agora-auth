import type { ApiClient } from "@/src/db/schema";
import { DrizzleApiClientRepository } from "@/src/repositories/ApiClientRepository";
import { hashApiKey, verifyApiKey } from "@/src/lib/crypto";
import { AgoraError } from "@/src/lib/errors";
import { logger } from "@/src/lib/logger";
import type { CreateClientRequest, UpdateClientRequest } from "../contracts";
import { createPublicId, stripUndefined, isSafeRedirect } from "@/src/lib/utils";

/**
 * Service responsible for validating external API clients and resolving
 * their respective paths for emails and redirects.
 */
export const ApiClientService = {
  /**
   * Authenticates an external API client using their client ID and plain text API key.
   * Disallows inactive clients.
   *
   * @param clientId The public client identifier.
   * @param plainApiKey The plain text API key provided in the request headers.
   * @returns The validated ApiClient entity.
   * @throws {AgoraError} INVALID_CREDENTIALS if credentials do not match or client is inactive.
   */
  async authenticate(clientId: string, plainApiKey: string): Promise<ApiClient> {
    const client = await DrizzleApiClientRepository.findByClientId(clientId);
    const isValidKey = client ? verifyApiKey(plainApiKey, client.apiKeyHash) : false;

    if (!client?.isActive || !isValidKey) throw new AgoraError("INVALID_CREDENTIALS");

    return client;
  },

  /**
   * Generates the fully qualified URL for email verification specifically for this client.
   * Replaces dynamic tokens in the client's configured `verifyEmailPath`.
   *
   * @param client The validated ApiClient.
   * @param token The raw string verification token.
   * @returns The absolute URL string.
   */
  buildVerifyEmailUrl(client: ApiClient, token: string): string {
    const url = new URL(client.verifyEmailPath, client.baseUrl);
    url.searchParams.set("token", token);
    return url.toString();
  },

  /**
   * Generates the fully qualified URL for password resets specifically for this client.
   * Replaces dynamic tokens in the client's configured `resetPasswordPath`.
   *
   * @param client The validated ApiClient.
   * @param token The raw string reset token.
   * @returns The absolute URL string.
   */
  buildResetPasswordUrl(client: ApiClient, token: string): string {
    const url = new URL(client.resetPasswordPath, client.baseUrl);
    url.searchParams.set("token", token);
    return url.toString();
  },

  /**
   * Validates if a provided origin matches the client's configured base URL.
   * Useful for enforcing that requests or post-login redirects actually originate from
   * or lead to the allowed client domain, preventing Open Redirect attacks.
   *
   * @param client The validated ApiClient.
   * @param urlToVerify The requested redirect URL or origin.
   * @returns True if the URL is allowed.
   */
  verifyAllowedOrigin(client: ApiClient, urlToVerify: string): boolean {
    return isSafeRedirect(client.baseUrl, urlToVerify);
  },

  async create(clientData: CreateClientRequest): Promise<ApiClient> {
    try {
      const apiKeyHash = hashApiKey(clientData.plainApiKey); // example crypto function

      const clientId = createPublicId();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { plainApiKey, ...cleanedClientData } = clientData;

      return await DrizzleApiClientRepository.create({
        ...cleanedClientData,
        clientId,
        apiKeyHash,
      });
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      logger.error("Error creating API client. Potential database or connection issue.", e);
      throw new AgoraError("INTERNAL");
    }
  },

  async update(id: string, clientData: UpdateClientRequest): Promise<ApiClient> {
    try {
      // Strip undefined values to satisfy exactOptionalPropertyTypes in TS
      // and match Drizzle's strict Partial<NewObject> requirements.
      const cleanedData = stripUndefined(clientData);

      return await DrizzleApiClientRepository.update(id, cleanedData);
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      logger.error(`Error updating API client with ID ${id}.`, e);
      throw new AgoraError("INTERNAL");
    }
  },

  async delete(id: string): Promise<ApiClient> {
    try {
      return await DrizzleApiClientRepository.delete(id);
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      logger.error(`Error deleting API client with ID ${id}.`, e);
      throw new AgoraError("INTERNAL");
    }
  },
};
