import { db } from "@/src/db";
import { type ApiClient, type NewApiClient, apiClients } from "@/src/db/schema";
import type { ApiClientRepository } from "@/src/features/auth/contracts";
import { AgoraError } from "@/src/lib/errors";
import { eq } from "drizzle-orm";

export const DrizzleApiClientRepository: ApiClientRepository = {
  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------
  async create(data: NewApiClient): Promise<ApiClient> {
    const [result] = await db
      .insert(apiClients)
      .values(data)
      .onConflictDoNothing({ target: apiClients.name })
      .returning();

    if (result) return result;

    const [existingClient] = await db.select().from(apiClients).where(eq(apiClients.name, data.name)).limit(1);
    if (!existingClient) throw new AgoraError("INTERNAL", "Failed to create or fetch client.");

    return existingClient;
  },

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------
  async findById(id: string): Promise<ApiClient | null> {
    const result = await db.select().from(apiClients).where(eq(apiClients.id, id)).limit(1);
    return result[0] || null;
  },

  async findByName(name: string): Promise<ApiClient | null> {
    const result = await db.select().from(apiClients).where(eq(apiClients.name, name)).limit(1);
    return result[0] || null;
  },

  async findByClientId(clientId: string): Promise<ApiClient | null> {
    const result = await db.select().from(apiClients).where(eq(apiClients.clientId, clientId)).limit(1);
    return result[0] || null;
  },

  async findAll(): Promise<ApiClient[]> {
    return await db.select().from(apiClients);
  },

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  async update(id: string, data: Partial<Omit<NewApiClient, "id" | "createdAt" | "updatedAt">>): Promise<ApiClient> {
    const [updatedClient] = await db
      .update(apiClients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(apiClients.id, id))
      .returning();

    if (!updatedClient) throw new AgoraError("NOT_FOUND", "Client not found.");
    return updatedClient;
  },

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  async delete(id: string): Promise<ApiClient> {
    const [deletedClient] = await db.delete(apiClients).where(eq(apiClients.id, id)).returning();
    if (!deletedClient) throw new AgoraError("NOT_FOUND", "Client not found.");
    return deletedClient;
  },
};
