import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sessionsTable } from "./sessions";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctOption: text("correct_option").notNull(),
  topic: text("topic").notNull(),
  explanation: text("explanation"),
  timestamp: text("timestamp"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questionsRelations = relations(questionsTable, ({ one }) => ({
  session: one(sessionsTable, {
    fields: [questionsTable.sessionId],
    references: [sessionsTable.id],
  }),
}));

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
