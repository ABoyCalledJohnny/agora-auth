// import { db } from ".";
// import { roles } from "./schema";
import { SYSTEM_ROLE_NAMES } from "@/src/config/constants.ts";
import { db } from ".";
import { appConfig } from "../config";
import { hashApiKey, hashPassword } from "../lib/crypto.ts";
import { AgoraError } from "../lib/errors.ts";
import { createPublicId } from "../lib/utils.ts";
import { DrizzleApiClientRepository } from "../repositories/ApiClientRepository.ts";
import { DrizzleRoleRepository } from "../repositories/RoleRepository.ts";
import { userCredentials, users, usersRoles } from "./schema";

async function seedRoles() {
  console.log("Seeding user roles...");

  for (const role of SYSTEM_ROLE_NAMES) {
    await DrizzleRoleRepository.create({ name: role });
  }
}

async function seedAdminAccount() {
  console.log("Seeding initial admin account...");

  await db.transaction(async (tx) => {
    // 1. Create base user (using the raw Drizzle transaction tx)
    const [adminUser] = await tx
      .insert(users)
      .values({
        publicId: createPublicId(),
        username: appConfig.bootstrap.initialAdminUsername,
        email: appConfig.bootstrap.initialAdminEmail,
        status: "active",
        emailVerifiedAt: new Date(),
      })
      .returning();

    if (!adminUser) throw new AgoraError("INTERNAL", "Error creating bootstrap admin user");

    // 2. Set credentials
    const hashedPassword = await hashPassword(appConfig.bootstrap.initialAdminPassword); // Need a hashing tool here!
    await tx.insert(userCredentials).values({ userId: adminUser.id, passwordHash: hashedPassword });

    // 3. Find admin role and assign it
    // Note: DrizzleRoleRepository.findByName isn't inherently transaction aware, but lookups are safe
    const adminRole = await DrizzleRoleRepository.findByName("admin");
    if (adminRole) {
      await tx.insert(usersRoles).values({ userId: adminUser.id, roleId: adminRole.id });
    }
  });
}

async function seedDefaultClient() {
  console.log("Seeding default API client...");

  await DrizzleApiClientRepository.create({
    name: appConfig.clients.defaultClientName,
    clientId: appConfig.clients.defaultClientId,
    apiKeyHash: hashApiKey(appConfig.bootstrap.defaultClientSecret),
    baseUrl: appConfig.app.url,
    verifyEmailPath: appConfig.clients.defaultVerifyEmailPath,
    resetPasswordPath: appConfig.clients.defaultResetPasswordPath,
  });
}

async function bootstrap() {
  console.log("Starting database bootstrap...");

  try {
    // 1. Roles must exist first for foreign key constraints
    await seedRoles();

    // 2. Admin account depends on roles
    await seedAdminAccount();

    // 3. API client is independent but essential
    await seedDefaultClient();

    console.log("Database bootstrap completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to bootstrap database:", error);
    process.exit(1);
  }
}

// Execute the bootstrap script
bootstrap();
