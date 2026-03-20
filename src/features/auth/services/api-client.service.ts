import type { CreateClientRequest, UpdateClientRequest } from "../contracts.ts";
import type { ApiClient } from "@/src/db/schema/index.ts";

import { hashToken, verifyToken } from "@/src/lib/crypto.ts";
import { AgoraError, handleServiceError } from "@/src/lib/errors.ts";
import { createPublicId, isSafeRedirect, stripUndefined } from "@/src/lib/utils.ts";
import { DrizzleApiClientRepository } from "@/src/repositories/api-client.repository.ts";

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
    const isValidKey = client ? verifyToken(plainApiKey, client.apiKeyHash) : false;

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
    } catch (e) {
      handleServiceError(e, "Error creating API client. Potential database or connection issue.");
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
      // Strip undefined values to satisfy exactOptionalPropertyTypes in TS
      // and match Drizzle's strict Partial<NewObject> requirements.
      const cleanedData = stripUndefined(clientData);

      return await DrizzleApiClientRepository.update(id, cleanedData);
    } catch (e) {
      handleServiceError(e, `Error updating API client with ID ${id}.`);
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
    } catch (e) {
      handleServiceError(e, `Error deleting API client with ID ${id}.`);
    }
  },
};
