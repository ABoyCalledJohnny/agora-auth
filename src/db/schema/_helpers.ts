// src/db/schema/_helpers.ts
import { text, timestamp, uuid } from "drizzle-orm/pg-core";

export const idColumn = (name = "id") => uuid(name).defaultRandom().primaryKey();
export const uniqueNotNullableTextColumn = (name = "name") => text(name).notNull().unique();

export const createdAtColumn = (name = "createdAt") => timestamp(name, { withTimezone: true }).notNull().defaultNow();
export const updatedAtColumn = (name = "updatedAt") =>
  timestamp(name, { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date());
export const deletedAtColumn = (name = "deletedAt") => timestamp(name, { withTimezone: true });
export const verifiedAtColumn = (name = "verifieddAt") => timestamp(name, { withTimezone: true });
