import type { ApiClientRepository } from "@/src/features/auth/contracts.ts";

import { eq } from "drizzle-orm";

import { db } from "@/src/db/index.ts";
import { type ApiClient, apiClients, type NewApiClient } from "@/src/db/schema/index.ts";
import { AgoraError } from "@/src/lib/errors.ts";

export const DrizzleApiClientRepository: ApiClientRepository = {
  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------
  async findById(id: string): Promise<ApiClient | null> {
    const [client] = await db.select().from(apiClients).where(eq(apiClients.id, id)).limit(1);
    return client ?? null;
  },

  async findByName(name: string): Promise<ApiClient | null> {
    const [client] = await db.select().from(apiClients).where(eq(apiClients.name, name)).limit(1);
    return client ?? null;
  },

  async findByClientId(clientId: string): Promise<ApiClient | null> {
    const [client] = await db.select().from(apiClients).where(eq(apiClients.clientId, clientId)).limit(1);
    return client ?? null;
  },

  async findAll(): Promise<ApiClient[]> {
    return await db.select().from(apiClients);
  },

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
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
