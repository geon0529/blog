import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schemas";

// 연결 설정
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  prepare: false,
  connection: {
    search_path: "public",
    timezone: "Asia/Seoul",
  },
});
export const db = drizzle(client, { schema });
export type Database = typeof db;
