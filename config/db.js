import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE } = process.env;

// ✅ Ensure all environment variables are present
if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE) {
    console.error("❌ Missing PostgreSQL environment variables!");
    process.exit(1);
}

// ✅ Initialize PostgreSQL connection
export const sql = neon(`postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`);
