// import { db } from './index';
// Import your schemas here once created
// import * as schema from './schema';

import { db } from ".";
import { roles } from "./schema";
import { SYSTEM_ROLE_NAMES } from "@/src/lib/validation";

async function seedRoles() {
  console.log("Seeding user roles...");
  await db
    .insert(roles)
    .values(SYSTEM_ROLE_NAMES.map((name) => ({ name })))
    .onConflictDoNothing({ target: roles.name });
}

async function seedAdminAccount() {
  console.log("Seeding initial admin account...");
  // TODO: Check for INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD in env
  // TODO: Hash password and insert admin user if it doesn't exist
}

async function seedDefaultClient() {
  console.log("Seeding default API client...");
  // TODO: Check for DEFAULT_CLIENT_SECRET in env
  // TODO: Hash secret and insert default API client if it doesn't exist
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
