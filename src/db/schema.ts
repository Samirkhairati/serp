import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  author_id: varchar({ length: 12 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).unique(),
  department: varchar({ length: 255 }),
});

export const publicationsTable = pgTable("publications", {
  title: text().notNull(),
  type: varchar({ length: 50 }),
  journal: varchar({ length: 255 }),
  volume: varchar({ length: 50 }),
  issue: varchar({ length: 50 }),
  year: varchar({ length: 4 }),
  link: varchar({ length: 255 }).notNull(),
  citations: varchar({ length: 50 }).notNull(),
  citation_id: varchar({ length: 50 }).notNull().primaryKey(),
  author_ids: varchar({ length: 12 })
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  author_names: varchar({ length: 255 })
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
});
