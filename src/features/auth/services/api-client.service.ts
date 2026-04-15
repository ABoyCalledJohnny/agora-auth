/**
 * API client service.
 * Validates external API clients and resolves their email/redirect paths.
 */

import "server-only";

import type { CreateClientRequest, UpdateClientRequest } from "../contracts.ts";
import type { ApiClient } from "@/src/db/schema/index.ts";

import { appConfig } from "@/src/config/index.ts";
import { hashToken, verifyToken } from "@/src/lib/crypto.ts";
import { AgoraError } from "@/src/lib/errors.ts";
import { handleServiceError } from "@/src/lib/service-error.ts";
import { createPublicId, isSafeRedirect, stripUndefined } from "@/src/lib/utils.ts";
import { DrizzleApiClientRepository } from "@/src/repositories/api-client.repository.ts";

export const ApiClientService = {
  /**
   * Retrieves the default first-party web application client.
   *
   * @returns The default ApiClient entity.
   * @throws {AgoraError} INTERNAL if the default client is missing.
   */
  async getDefaultClient(): Promise<ApiClient> {
    const client = await DrizzleApiClientRepository.findByClientId(appConfig.clients.defaultClientId);
    if (!client) {
      throw new AgoraError("INTERNAL", "Default API client not found in database.");
    }
    return client;
  },

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
    const isValidKey = client ? verifyToken(plainApiKey, client.apiKeyHash) : false;

    if (!client?.isActive || !isValidKey) throw new AgoraError("INVALID_CREDENTIALS");

    return client;
  },

  /**
   * Generates the fully qualified URL for email verification for this client.
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
   * Generates the fully qualified URL for password resets for this client.
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
   * Validates whether a provided origin matches the client's configured base URL.
   * Prevents open redirect attacks by ensuring redirects target the allowed domain.
   *
   * NOTE: Currently unused. Intended for a future multi-tenant OAuth flow where
   * external clients redirect through this auth server and their redirect URLs
   * need to be validated against their registered baseUrl.
   *
   * @param client The validated ApiClient.
   * @param urlToVerify The requested redirect URL or origin.
   * @returns True if the URL is allowed.
   */
  verifyAllowedOrigin(client: ApiClient, urlToVerify: string): boolean {
    return isSafeRedirect(client.baseUrl, urlToVerify);
  },

  /**
   * Creates a new API client, generating a unique public client ID
   * and hashing the provided plain text API key for secure storage.
   *
   * @param clientData The validated creation request data.
   * @returns The newly created ApiClient entity.
   */
  async create(clientData: CreateClientRequest): Promise<ApiClient> {
    try {
      const apiKeyHash = hashToken(clientData.plainApiKey);

      const clientId = createPublicId();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { plainApiKey, ...cleanedClientData } = clientData;

      return await DrizzleApiClientRepository.create({
        ...cleanedClientData,
        clientId,
        apiKeyHash,
      });
    } catch (error) {
      handleServiceError(error, "Error creating API client. Potential database or connection issue.");
    }
  },

  /**
   * Updates an existing API client.
   * Automatically strips undefined values to ensure database integrity.
   *
   * @param id The internal database ID of the client.
   * @param clientData The validated partial update request data.
   * @returns The updated ApiClient entity.
   */
  async update(id: string, clientData: UpdateClientRequest): Promise<ApiClient> {
    try {
      // Strip undefined values to satisfy exactOptionalPropertyTypes
      // and match Drizzle's strict Partial<NewObject> requirements.
      const cleanedData = stripUndefined(clientData);

      return await DrizzleApiClientRepository.update(id, cleanedData);
    } catch (error) {
      handleServiceError(error, `Error updating API client with ID ${id}.`);
    }
  },

  /**
   * Deletes an API client by its internal database ID.
   *
   * @param id The internal database ID of the client.
   * @returns The deleted ApiClient entity.
   */
  async delete(id: string): Promise<ApiClient> {
    try {
      return await DrizzleApiClientRepository.delete(id);
    } catch (error) {
      handleServiceError(error, `Error deleting API client with ID ${id}.`);
    }
  },
};
