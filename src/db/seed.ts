// import { db } from "./index.ts";
import { appConfig } from "../config/index.ts";

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

  await seedDevData();

  console.log("\nSeeding complete.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
