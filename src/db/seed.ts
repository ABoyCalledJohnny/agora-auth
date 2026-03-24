import { eq, like } from "drizzle-orm";
import { firstNames, lastNames, seed } from "drizzle-seed";

import { USER_STATUS } from "../config/constants.ts";
import { appConfig } from "../config/index.ts";
import { createPublicId } from "../lib/utils.ts";
import { db } from "./index.ts";
import * as schema from "./schema/index.ts";

const seedSchema = {
  users: schema.users,
  userSettings: schema.userSettings,
  userProfiles: schema.userProfiles,
};

const SEED_COUNT = 100;
const DRIZZLE_SEED_VALUE = 20260318;
const SEED_EMAIL_DOMAIN = "seed.local";

function toHandlePart(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
  return normalized.length > 0 ? normalized : "user";
}

function createSeedUsers(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const firstNameRaw = firstNames[(index * 17 + 11) % firstNames.length] ?? "Alex";
    const lastNameRaw = lastNames[(index * 29 + 7) % lastNames.length] ?? "Miller";
    const firstName = String(firstNameRaw);
    const lastName = String(lastNameRaw);

    const first = toHandlePart(firstName);
    const last = toHandlePart(lastName);
    const suffix = String(index + 1).padStart(3, "0");

    const username = `${first}_${last}_${suffix}`.slice(0, 30);
    const email = `${first}.${last}.${suffix}@${SEED_EMAIL_DOMAIN}`;
    const displayName = `${firstName} ${lastName}`;

    return {
      firstName,
      lastName,
      displayName,
      username,
      email,
      publicId: createPublicId(),
    };
  });
}

const seedUsers = createSeedUsers(SEED_COUNT);

async function seedDevData(): Promise<void> {
  if (appConfig.app.env !== "development") {
    console.log("Skipping seed: APP_ENV is not development.");
    return;
  }

  await db.delete(schema.users).where(like(schema.users.email, `%@${SEED_EMAIL_DOMAIN}`));

  await seed(db, seedSchema, { count: 0, seed: DRIZZLE_SEED_VALUE }).refine((funcs) => ({
    users: {
      count: SEED_COUNT,
      columns: {
        publicId: funcs.valuesFromArray({ values: seedUsers.map((user) => user.publicId), isUnique: true }),
        username: funcs.valuesFromArray({ values: seedUsers.map((user) => user.username), isUnique: true }),
        email: funcs.valuesFromArray({ values: seedUsers.map((user) => user.email), isUnique: true }),
        status: funcs.valuesFromArray({ values: [...USER_STATUS] }),
      },
      with: {
        userSettings: 1,
        userProfiles: 1,
      },
    },
    userSettings: {
      columns: {
        privacySettings: funcs.weightedRandom([
          {
            weight: 0.5,
            value: funcs.default({
              defaultValue: {
                profileVisibility: "private",
                showOnlineStatus: false,
                allowIndexing: false,
              },
            }),
          },
          {
            weight: 0.35,
            value: funcs.default({
              defaultValue: {
                profileVisibility: "members_only",
                showOnlineStatus: true,
                allowIndexing: false,
              },
            }),
          },
          {
            weight: 0.15,
            value: funcs.default({
              defaultValue: {
                profileVisibility: "private",
                showOnlineStatus: true,
                allowIndexing: true,
              },
            }),
          },
        ]),
        preferences: funcs.weightedRandom([
          {
            weight: 0.4,
            value: funcs.default({
              defaultValue: {
                theme: "light",
                language: "en",
                notifications: {
                  email: {
                    transactional: true,
                    marketing: false,
                    security: true,
                    newsletter: false,
                  },
                  push: {
                    messages: false,
                    mentions: false,
                    updates: true,
                    posts: false,
                  },
                },
              },
            }),
          },
          {
            weight: 0.35,
            value: funcs.default({
              defaultValue: {
                theme: "dark",
                language: "de",
                notifications: {
                  email: {
                    transactional: true,
                    marketing: false,
                    security: true,
                    newsletter: true,
                  },
                  push: {
                    messages: true,
                    mentions: true,
                    updates: true,
                    posts: false,
                  },
                },
              },
            }),
          },
          {
            weight: 0.25,
            value: funcs.default({
              defaultValue: {
                theme: "system",
                language: "en",
                notifications: {
                  email: {
                    transactional: true,
                    marketing: true,
                    security: true,
                    newsletter: true,
                  },
                  push: {
                    messages: true,
                    mentions: false,
                    updates: false,
                    posts: true,
                  },
                },
              },
            }),
          },
        ]),
      },
    },
    userProfiles: {
      columns: {
        firstName: funcs.valuesFromArray({ values: seedUsers.map((user) => user.firstName) }),
        lastName: funcs.valuesFromArray({ values: seedUsers.map((user) => user.lastName) }),
        displayName: funcs.valuesFromArray({ values: seedUsers.map((user) => user.displayName), isUnique: true }),
        tagline: funcs.valuesFromArray({
          values: [
            "Building reliable systems",
            "Product-minded developer",
            "Security and DX enthusiast",
            "Curious and pragmatic",
            "Always learning",
          ],
        }),
        bio: funcs.loremIpsum({ sentencesCount: 2 }),
        location: funcs.city(),
        pronouns: funcs.valuesFromArray({ values: ["he/him", "she/her", "they/them"] }),
        websiteUrl: funcs.default({ defaultValue: null }),
        avatarUrl: funcs.valuesFromArray({
          values: seedUsers.map((user) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`),
        }),
        hobbies: funcs.valuesFromArray({
          values: [
            ["Reading", "Traveling"] as unknown as string,
            ["Coding", "Gaming"] as unknown as string,
            ["Photography", "Cooking"] as unknown as string,
            ["Music", "Running"] as unknown as string,
            ["Writing", "Hiking"] as unknown as string,
            ["Painting", "Cycling"] as unknown as string,
            ["Yoga", "Meditation"] as unknown as string,
            ["Gardening", "Baking"] as unknown as string,
            ["Dancing", "Singing"] as unknown as string,
            ["Swimming", "Dancing"] as unknown as string,
          ],
        }),
      },
    },
  }));

  // Assign "user" role to seeded users
  const [userRole] = await db.select().from(schema.roles).where(eq(schema.roles.name, "user"));
  if (userRole) {
    const seededUsers = await db
      .select()
      .from(schema.users)
      .where(like(schema.users.email, `%@${SEED_EMAIL_DOMAIN}`));
    const userRoleInserts = seededUsers.map((user) => ({
      userId: user.id,
      roleId: userRole.id,
    }));
    if (userRoleInserts.length > 0) {
      await db.insert(schema.usersRoles).values(userRoleInserts).onConflictDoNothing();
    }
  }

  console.log(`Development seed data inserted (${SEED_COUNT} users with realistic profiles/settings and "user" role).`);
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
