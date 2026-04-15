/**
 * API Client Repository
 *
 * Data-access layer for managing external API clients (B2B integrations).
 * Handles creation, conflict resolution, updates, and querying of API credentials.
 */

import type { ApiClientRepository } from "@/src/features/auth/contracts.ts";

import { eq } from "drizzle-orm";

import { db } from "@/src/db/index.ts";
import { type ApiClient, apiClients, type NewApiClient } from "@/src/db/schema/index.ts";
import { AgoraError } from "@/src/lib/errors.ts";

export const DrizzleApiClientRepository: ApiClientRepository = {
  /**
   * Creates a new API client, or overwrites an existing one if a name conflict occurs.
   *
   * @param data The validated payload for creating an API client.
   * @returns The fully persisted ApiClient entity.
   * @throws {AgoraError} CLIENT_CONFLICT if unique constraints are violated.
   */
  async create(data: NewApiClient): Promise<ApiClient> {
    try {
      const [result] = await db
        .insert(apiClients)
        .values(data)
        .onConflictDoUpdate({
          target: apiClients.name,
          set: {
            clientId: data.clientId,
            apiKeyHash: data.apiKeyHash,
            baseUrl: data.baseUrl,
            verifyEmailPath: data.verifyEmailPath,
            resetPasswordPath: data.resetPasswordPath,
            isActive: data.isActive,
            skipEmailVerification: data.skipEmailVerification,
          },
        })
        .returning();

      if (!result) throw new AgoraError("INTERNAL", "Failed to create or fetch client.");

      return result;
    } catch (error: unknown) {
      if (error instanceof AgoraError) throw error;

      const pgError = error as Record<string, unknown>;
      if (pgError && pgError.code === "23505") {
        throw new AgoraError("CLIENT_CONFLICT");
      }

      throw new AgoraError("INTERNAL", "A database error occurred while creating the API client.");
    }
  },

  /**
   * Looks up an API client by its internal database ID.
   *
   * @param id The internal database ID.
   * @returns The resolved ApiClient, or null if not found.
   */
  async findById(id: string): Promise<ApiClient | null> {
    const [client] = await db.select().from(apiClients).where(eq(apiClients.id, id)).limit(1);
    return client ?? null;
  },

  /**
   * Looks up an API client by its name.
   *
   * @param name The descriptive name of the client.
   * @returns The resolved ApiClient, or null if not found.
   */
  async findByName(name: string): Promise<ApiClient | null> {
    const [client] = await db.select().from(apiClients).where(eq(apiClients.name, name)).limit(1);
    return client ?? null;
  },

  /**
   * Looks up an API client by its public `clientId`.
   *
   * @param clientId The unique public identifier of the client.
   * @returns The resolved ApiClient, or null if not found.
   */
  async findByClientId(clientId: string): Promise<ApiClient | null> {
    const [client] = await db.select().from(apiClients).where(eq(apiClients.clientId, clientId)).limit(1);
    return client ?? null;
  },

  /**
   * Retrieves all registered API clients.
   *
   * @returns An array of all existing ApiClient entities.
   */
  async findAll(): Promise<ApiClient[]> {
    return await db.select().from(apiClients);
  },

  /**
   * Applies partial updates to an existing API client.
   *
   * @param id The internal ID of the target client.
   * @param data The subset of properties to update.
   * @returns The updated ApiClient object.
   * @throws {AgoraError} NOT_FOUND if the client ID does not exist.
   * @throws {AgoraError} CLIENT_CONFLICT on unique constraint violations.
   */
  async update(id: string, data: Partial<Omit<NewApiClient, "id" | "createdAt" | "updatedAt">>): Promise<ApiClient> {
    try {
      const [updatedClient] = await db.update(apiClients).set(data).where(eq(apiClients.id, id)).returning();

      if (!updatedClient) throw new AgoraError("NOT_FOUND", "Client not found.");
      return updatedClient;
    } catch (error: unknown) {
      if (error instanceof AgoraError) throw error;

      const pgError = error as Record<string, unknown>;
      if (pgError && pgError.code === "23505") {
        throw new AgoraError("CLIENT_CONFLICT");
      }

      throw new AgoraError("INTERNAL", "A database error occurred while updating the API client.");
    }
  },

  /**
   * Permanently deletes an API client from the database.
   *
   * @param id The internal ID of the client to delete.
   * @returns The deleted ApiClient entity.
   * @throws {AgoraError} NOT_FOUND if the target does not exist.
   */
  async delete(id: string): Promise<ApiClient> {
    try {
      const [deletedClient] = await db.delete(apiClients).where(eq(apiClients.id, id)).returning();
      if (!deletedClient) throw new AgoraError("NOT_FOUND", "Client not found.");
      return deletedClient;
    } catch (error) {
      if (error instanceof AgoraError) throw error;
      throw new AgoraError("INTERNAL", "A database error occurred while deleting the API client.");
    }
  },
};
