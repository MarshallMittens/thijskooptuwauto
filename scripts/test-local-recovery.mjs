import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Lokale Supabase-variabelen ontbreken in .env.local.");
const parsedUrl = new URL(url);
if (!["127.0.0.1", "localhost"].includes(parsedUrl.hostname)) throw new Error("Herstelproef is uitsluitend toegestaan tegen lokale Supabase.");

const suffix = randomBytes(6).toString("hex");
const databaseName = `phase6_restore_${suffix}`;
const dumpPath = `/tmp/${databaseName}.dump`;
const sourceBucket = `recovery-source-${suffix}`;
const targetBucket = `recovery-target-${suffix}`;
const objectPath = `fixtures/${suffix}.bin`;
const fixture = randomBytes(4096);
const fixtureHash = createHash("sha256").update(fixture).digest("hex");
const startedAt = new Date().toISOString();
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

function docker(...args) {
  return execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

const containers = docker("ps", "--format", "{{.Names}}").split(/\r?\n/).filter(Boolean);
const dbContainer = containers.find((name) => name.startsWith("supabase_db_"));
if (!dbContainer) throw new Error("Lokale Supabase-databasecontainer niet gevonden.");

let databaseRestored = false;
let storageRestored = false;
let tableCount = 0;
let objectCount = 0;
let status = "failed";
let failure = null;

try {
  docker("exec", dbContainer, "pg_dump", "-U", "postgres", "-Fc", "--no-owner", "--no-privileges",
    "--schema=public", "--schema=private", "--schema=auth", "--schema=storage",
    "-f", dumpPath, "postgres");
  docker("exec", dbContainer, "createdb", "-U", "postgres", databaseName);
  docker("exec", dbContainer, "psql", "-U", "postgres", "-d", databaseName, "-v", "ON_ERROR_STOP=1", "-c", "drop schema public cascade;");
  docker("exec", dbContainer, "psql", "-U", "postgres", "-d", databaseName, "-v", "ON_ERROR_STOP=1", "-c",
    "create schema extensions; create schema vault; create extension pgcrypto with schema extensions; create extension \"uuid-ossp\" with schema extensions; create extension pg_stat_statements with schema extensions; create extension supabase_vault with schema vault;");
  docker("exec", dbContainer, "pg_restore", "-U", "postgres", "--no-owner", "--no-privileges", "--exit-on-error", "-d", databaseName, dumpPath);
  const countText = docker("exec", dbContainer, "psql", "-U", "postgres", "-d", databaseName, "-Atc", "select count(*) from information_schema.tables where table_schema in ('public','private','storage','auth');");
  tableCount = Number(countText);
  if (!Number.isInteger(tableCount) || tableCount < 10) throw new Error("Herstelde database bevat te weinig verwachte tabellen.");
  databaseRestored = true;

  const { error: sourceError } = await admin.storage.createBucket(sourceBucket, { public: false, fileSizeLimit: 1024 * 1024 });
  if (sourceError) throw sourceError;
  const { error: targetError } = await admin.storage.createBucket(targetBucket, { public: false, fileSizeLimit: 1024 * 1024 });
  if (targetError) throw targetError;
  const { error: uploadError } = await admin.storage.from(sourceBucket).upload(objectPath, fixture, { contentType: "application/octet-stream", upsert: false });
  if (uploadError) throw uploadError;
  const { data: downloaded, error: downloadError } = await admin.storage.from(sourceBucket).download(objectPath);
  if (downloadError || !downloaded) throw downloadError ?? new Error("Storage-back-updownload ontbreekt.");
  const backupBytes = Buffer.from(await downloaded.arrayBuffer());
  const { error: restoreError } = await admin.storage.from(targetBucket).upload(objectPath, backupBytes, { contentType: "application/octet-stream", upsert: false });
  if (restoreError) throw restoreError;
  const { data: restored, error: restoredError } = await admin.storage.from(targetBucket).download(objectPath);
  if (restoredError || !restored) throw restoredError ?? new Error("Hersteld Storage-object ontbreekt.");
  const restoredBytes = Buffer.from(await restored.arrayBuffer());
  const restoredHash = createHash("sha256").update(restoredBytes).digest("hex");
  if (restoredHash !== fixtureHash) throw new Error("Checksum van hersteld Storage-object wijkt af.");
  storageRestored = true;
  objectCount = 1;
  status = "completed";
} catch (error) {
  failure = error instanceof Error ? error.message.slice(0, 300) : "unknown";
} finally {
  for (const bucket of [sourceBucket, targetBucket]) {
    await admin.storage.emptyBucket(bucket).catch(() => undefined);
    await admin.storage.deleteBucket(bucket).catch(() => undefined);
  }
  try { docker("exec", dbContainer, "dropdb", "-U", "postgres", "--if-exists", "--force", databaseName); } catch {}
  try { docker("exec", dbContainer, "rm", "-f", dumpPath); } catch {}
  await admin.rpc("record_local_recovery_test", {
    p_status: status,
    p_database_restored: databaseRestored,
    p_storage_restored: storageRestored,
    p_table_count: tableCount,
    p_object_count: objectCount,
    p_evidence: { synthetic: true, databaseNamePrefix: "phase6_restore_", sha256: fixtureHash, failure },
    p_started_at: startedAt,
  });
}

if (status !== "completed") throw new Error(`Herstelproef mislukt: ${failure ?? "onbekend"}`);
console.log(`PASS: geïsoleerde lokale database (${tableCount} tabellen) en private Storage (${objectCount} object) hersteld en gecontroleerd.`);
