import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionsTable = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  youtubeUrl: text("youtube_url"),
  videoUrl: text("video_url"),
  status: text("status").notNull().default("pending"),
  transcript: text("transcript"),
  summary: text("summary"),
  keyTopics: text("key_topics", { mode: "json" }).$type<string[]>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
