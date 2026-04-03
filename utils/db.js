import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const client = postgres(process.env.DRIZZLE_DB_URL, { max: 1, ssl: "require", prepare: false });
export const db = drizzle(client, { schema });
