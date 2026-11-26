import { resetDatabase } from "../lib/reset-database.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const { products } = await resetDatabase(connectionString);
console.log(`Database reset: schema created, ${products} products seeded.`);
