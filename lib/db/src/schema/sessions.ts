import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { questionsTable } from "./questions.js";
import { attemptsTable } from "./attempts.js";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  youtubeUrl: text("youtube_url"),
  videoUrl: text("video_url"),
  requestedQuestionCount: integer("requested_question_count").default(10),
  status: text("status").notNull().default("pending"),
  transcript: text("transcript"),
  summary: text("summary"),
  keyTopics: text("key_topics").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessionsRelations = relations(sessionsTable, ({ many }) => ({
  questions: many(questionsTable),
  attempts: many(attemptsTable),
}));

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
