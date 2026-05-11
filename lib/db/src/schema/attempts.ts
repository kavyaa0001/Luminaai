import { pgTable, serial, text, timestamp, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sessionsTable } from "./sessions.js";

export const attemptsTable = pgTable("attempts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  percentage: doublePrecision("percentage").notNull(),
  strongTopics: jsonb("strong_topics").$type<string[]>().notNull().default([]),
  weakTopics: jsonb("weak_topics").$type<string[]>().notNull().default([]),
  answers: jsonb("answers").$type<any[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const attemptsRelations = relations(attemptsTable, ({ one }) => ({
  session: one(sessionsTable, {
    fields: [attemptsTable.sessionId],
    references: [sessionsTable.id],
  }),
}));

export const insertAttemptSchema = createInsertSchema(attemptsTable).omit({ id: true, createdAt: true });
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attemptsTable.$inferSelect;
