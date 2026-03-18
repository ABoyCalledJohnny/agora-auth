import { seed } from "drizzle-seed";
import * as schema from "./schema/index.ts";
import { db } from "./index.ts";
import { appConfig } from "../config/index.ts";

async function seedDevData(): Promise<void> {
  console.log("Emptying old dev data...");
  try {
    await db.delete(schema.apiClients);
    await db.delete(schema.users);
    await db.delete(schema.roles);
  } catch (e) {
    console.log("Could not delete some rows, maybe they don't exist yet.");
  }

  console.log("Generating and inserting development seed data...");

  // Create a version of the schema without the tricky backwards relations
  // that cause Drizzle Seed to get confused about cyclic/1-to-1 references.
  const schemaForSeed = { ...schema } as any;
  delete schemaForSeed.usersRelations;

  try {
    await seed(db, schemaForSeed, {
      count: 10,
      seed: Math.floor(Math.random() * 100000),
    });
    console.log("Development seed data inserted.");
  } catch (err) {
    console.error("Drizzle Seed failed with auto-generated constraints.", err);
    console.log("You may need to manually refine unique relationships with .refine() due to 1-to-1 uniqueness.");
    throw err;
  }
}

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
