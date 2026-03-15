// import { db } from "./index.ts";
import { appConfig } from "../config/index.ts";

// ---------------------------------------------------------------------------
// Seed: Admin Account
// ---------------------------------------------------------------------------
// Creates the initial admin user. Prompts for credentials interactively
// when run from a terminal. Falls back to env vars for CI/non-interactive
// environments (SEED_ADMIN_EMAIL, SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD).
// ---------------------------------------------------------------------------

async function seedAdminAccount(): Promise<void> {
  const isInteractive = process.stdin.isTTY;

  const email = isInteractive ? (prompt("Admin email: ") ?? "") : (process.env.SEED_ADMIN_EMAIL ?? "");

  const username = isInteractive ? (prompt("Admin username: ") ?? "") : (process.env.SEED_ADMIN_USERNAME ?? "");

  const password = isInteractive ? (prompt("Admin password: ") ?? "") : (process.env.SEED_ADMIN_PASSWORD ?? "");

  if (!email || !username || !password) {
    console.error("Error: email, username, and password are all required.");
    process.exit(1);
  }

  // TODO: Implement — hash password, insert user + credentials + role assignment
  // const passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });
  // Insert into users, user_credentials, users_roles (admin role)

  console.log(`Admin account "${username}" seeded.`);
}

// ---------------------------------------------------------------------------
// Seed: Development Data
// ---------------------------------------------------------------------------
// Inserts dummy users for local development. Only runs when
// appConfig.env === "development".
// ---------------------------------------------------------------------------

async function seedDevData(): Promise<void> {
  // TODO: Implement — insert dummy users with hashed passwords and 'user' role

  console.log("Development seed data inserted.");
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`Seeding database (${appConfig.app.env})...\n`);

  await seedAdminAccount();

  if (appConfig.app.env === "development") {
    await seedDevData();
  }

  console.log("\nSeeding complete.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
