import type { ApiClientRepository } from "@/src/features/auth/contracts.ts";

import { eq } from "drizzle-orm";

import { db } from "@/src/db/index.ts";
import { type ApiClient, apiClients, type NewApiClient } from "@/src/db/schema/index.ts";
import { AgoraError } from "@/src/lib/errors.ts";

/**
 * DrizzleApiClientRepository
 *
 * Database access layer for managing external API clients (B2B integrations).
 * Handles creation, conflict resolution, updates, and querying of API credentials.
 */
export const DrizzleApiClientRepository: ApiClientRepository = {
  /**
   * Creates a new API client or strictly overwrites an existing one if a name conflict occurs.
   *
   * @param data The validated payload for generating an API client.
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
    } catch (e: unknown) {
      if (e instanceof AgoraError) throw e;

      const pgError = e as Record<string, unknown>;
      if (pgError && pgError.code === "23505") {
        throw new AgoraError("CLIENT_CONFLICT");
      }

      throw new AgoraError("INTERNAL", "A database error occurred while creating the API client.");
    }
  },

  /**
   * Looks up an API client intrinsically by its internal database auto-increment ID.
   *
   * @param id The internal database ID.
   * @returns The resolved ApiClient, or null if missing.
   */
  async findById(id: string): Promise<ApiClient | null> {
    const [client] = await db.select().from(apiClients).where(eq(apiClients.id, id)).limit(1);
    return client ?? null;
  },

  /**
   * Looks up an API client intrinsically by its distinct recognizable name.
   *
   * @param name The descriptive name of the B2B client.
   * @returns The resolved ApiClient, or null if missing.
   */
  async findByName(name: string): Promise<ApiClient | null> {
    const [client] = await db.select().from(apiClients).where(eq(apiClients.name, name)).limit(1);
    return client ?? null;
  },

  /**
   * Looks up an API client explicitly by its publicly accessible `clientId`.
   * Standard route for inbound credential validations.
   *
   * @param clientId The unique public identifier of the client.
   * @returns The resolved ApiClient, or null if missing.
   */
  async findByClientId(clientId: string): Promise<ApiClient | null> {
    const [client] = await db.select().from(apiClients).where(eq(apiClients.clientId, clientId)).limit(1);
    return client ?? null;
  },

  /**
   * Retrieves all registered API clients in the database.
   *
   * @returns An array mapping all existing internal client credentials.
   */
  async findAll(): Promise<ApiClient[]> {
    return await db.select().from(apiClients);
  },

  /**
   * Applies partial updates to an existing API client.
   * Protects intrinsic fields like ID or structural timeline data from mutation.
   *
   * @param id The internal ID of the target client.
   * @param data The subset of properties currently being overwritten.
   * @returns The correctly updated ApiClient object.
   * @throws {AgoraError} NOT_FOUND if the client ID does not exist, CLIENT_CONFLICT on identical constraints.
   */
  async update(id: string, data: Partial<Omit<NewApiClient, "id" | "createdAt" | "updatedAt">>): Promise<ApiClient> {
    try {
      const [updatedClient] = await db.update(apiClients).set(data).where(eq(apiClients.id, id)).returning();

      if (!updatedClient) throw new AgoraError("NOT_FOUND", "Client not found.");
      return updatedClient;
    } catch (e: unknown) {
      if (e instanceof AgoraError) throw e;

      const pgError = e as Record<string, unknown>;
      if (pgError && pgError.code === "23505") {
        throw new AgoraError("CLIENT_CONFLICT");
      }

      throw new AgoraError("INTERNAL", "A database error occurred while updating the API client.");
    }
  },

  /**
   * Totally eradicates an API Client permanently from the database.
   * Warning: This fundamentally unplugs whichever domain uses this client context directly.
   *
   * @param id The internal ID target for deletion.
   * @returns The fully deleted API Client.
   * @throws {AgoraError} NOT_FOUND if the target did not exist.
   */
  async delete(id: string): Promise<ApiClient> {
    try {
      const [deletedClient] = await db.delete(apiClients).where(eq(apiClients.id, id)).returning();
      if (!deletedClient) throw new AgoraError("NOT_FOUND", "Client not found.");
      return deletedClient;
    } catch (e) {
      if (e instanceof AgoraError) throw e;
      throw new AgoraError("INTERNAL", "A database error occurred while deleting the API client.");
    }
  },
};
