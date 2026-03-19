// src/db/schema/_helpers.ts
import { timestamp, uuid } from "drizzle-orm/pg-core";

export const idColumn = (name = "id") => uuid(name).defaultRandom().primaryKey();

export const createdAtColumn = (name = "createdAt") => timestamp(name, { withTimezone: true }).notNull().defaultNow();
export const updatedAtColumn = (name = "updatedAt") =>
  timestamp(name, { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date());
export const deletedAtColumn = (name = "deletedAt") => timestamp(name, { withTimezone: true });
export const verifiedAtColumn = (name = "verifiedAt") => timestamp(name, { withTimezone: true });
