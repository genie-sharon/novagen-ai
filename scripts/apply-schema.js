const { Client } = require("pg");
const fs = require("fs");

const CONFIGS = [
  { host: "db.dgfvxdjsoylezcguycrn.supabase.co", port: 5432 },
  { host: "dgfvxdjsoylezcguycrn.supabase.co", port: 5432 },
  { host: "dgfvxdjsoylezcguycrn.supabase.co", port: 6543 },
  { host: "aws-0-us-west-1.pooler.supabase.com", port: 6543 },
];

async function tryConnect(config) {
  const client = new Client({
    host: config.host,
    port: config.port,
    database: "postgres",
    user: "postgres",
    password: "71812453012@Gs",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  await client.connect();
  return client;
}

async function run() {
  let client = null;

  for (const cfg of CONFIGS) {
    try {
      console.log(`Trying ${cfg.host}:${cfg.port}...`);
      client = await tryConnect(cfg);
      console.log(`Connected via ${cfg.host}:${cfg.port}!`);
      break;
    } catch (e) {
      console.log(`  -> ${e.message.substring(0, 60)}`);
    }
  }

  if (!client) {
    throw new Error("Could not connect with any configuration");
  }

  const sql = fs.readFileSync("supabase/schema.sql", "utf8");

  const statements = sql
    .replace(/\n--.*$/gm, "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 5 && !s.startsWith("--"))
    .map((s) => s + ";");

  statements.push(`
CREATE POLICY "Users can access their own files"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);`.trim());

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      const firstLine = stmt.split("\n")[0].trim();
      console.log("OK:", firstLine.substring(0, 80));
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("already exists")) {
        console.log("SKIP:", stmt.split("\n")[0].trim().substring(0, 60));
      } else {
        console.error("ERROR:", msg.substring(0, 250));
      }
    }
  }

  await client.end();
  console.log("\nDone!");
}

run().catch((err) => console.error("FATAL:", err.message));
