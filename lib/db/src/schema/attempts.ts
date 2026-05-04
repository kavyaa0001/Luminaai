import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sessionsTable } from "./sessions";

export const attemptsTable = sqliteTable("attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  percentage: real("percentage").notNull(),
  strongTopics: text("strong_topics", { mode: "json" }).$type<string[]>().notNull().default([]),
  weakTopics: text("weak_topics", { mode: "json" }).$type<string[]>().notNull().default([]),
  answers: text("answers", { mode: "json" }).$type<any[]>().notNull().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertAttemptSchema = createInsertSchema(attemptsTable).omit({ id: true, createdAt: true });
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attemptsTable.$inferSelect;
