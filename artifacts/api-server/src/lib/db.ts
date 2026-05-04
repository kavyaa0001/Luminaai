import { jsonDb } from "./json-db";

// This is a placeholder for a real database (e.g. Postgres)
// In a real Vercel deployment, you would connect to Vercel Postgres here.
// For now, we use jsonDb but we add a warning for Vercel users.

export const db = {
  get sessions() { return jsonDb.data.sessions; },
  get questions() { return jsonDb.data.questions; },
  get attempts() { return jsonDb.data.attempts; },
  
  save() {
    if (process.env.VERCEL) {
      console.warn("WARNING: Running on Vercel. Data will NOT persist in data.json. Use a real database for production.");
    }
    jsonDb.save();
  }
};
