import { defineConfig } from "drizzle-kit";

// Use Supabase PostgreSQL Session Pooler connection string
const connectionString = process.env.SUPABASE_URL 
  ? "postgresql://postgres.xkmpxjemlpvqsxscxbmk:dxQbrLLvXsgODsKL@aws-1-ca-central-1.pooler.supabase.com:5432/postgres"
  : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("SUPABASE_URL or DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
