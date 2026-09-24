import { execFileSync, spawn } from "node:child_process";

const ids = {
  dealer1: "02000000-0000-0000-0000-0000000000d1",
  dealer2: "02000000-0000-0000-0000-0000000000d2",
  seller: "02000000-0000-0000-0000-0000000000e1",
  company1: "12000000-0000-0000-0000-0000000000d1",
  company2: "12000000-0000-0000-0000-0000000000d2",
  sellerContact: "22000000-0000-0000-0000-000000000001",
  vehicle: "32000000-0000-0000-0000-000000000001",
  application: "42000000-0000-0000-0000-000000000001",
  revision: "52000000-0000-0000-0000-000000000001",
  listing: "62000000-0000-0000-0000-000000000001",
  round: "72000000-0000-0000-0000-000000000001",
};

function findDatabaseContainer() {
  const names = execFileSync("docker", ["ps", "--format", "{{.Names}}"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const container = names.find((name) => name.startsWith("supabase_db_") && name.toLowerCase().includes("thijskooptuauto"))
    ?? names.find((name) => name.startsWith("supabase_db_"));
  if (!container) throw new Error("Geen lokale Supabase-databasecontainer gevonden. Start eerst npm run db:start.");
  return container;
}

const container = findDatabaseContainer();
const psqlArgs = ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-c"];

function psql(sql) {
  return execFileSync("docker", [...psqlArgs, sql], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function cleanup() {
  psql(`
    delete from public.notification_outbox where entity_id in (select id from public.bids where bid_round_id = '${ids.round}') or entity_id = '${ids.round}';
    delete from public.audit_log where entity_id in ('${ids.round}', '${ids.listing}') or actor_id in ('${ids.dealer1}', '${ids.dealer2}');
    delete from public.winner_reservations where bid_round_id = '${ids.round}';
    update public.bid_rounds set highest_bid_id = null where id = '${ids.round}';
    alter table public.bids disable trigger bids_append_only;
    delete from public.bids where bid_round_id = '${ids.round}';
    alter table public.bids enable trigger bids_append_only;
    delete from public.bid_rounds where id = '${ids.round}';
    delete from public.listings where id = '${ids.listing}';
    delete from public.vehicle_revisions where id = '${ids.revision}';
    delete from public.condition_reports where application_id = '${ids.application}';
    delete from public.seller_application_access where application_id = '${ids.application}';
    delete from public.applications where id = '${ids.application}';
    delete from public.vehicles where id = '${ids.vehicle}';
    delete from public.seller_contacts where id = '${ids.sellerContact}';
    delete from public.company_memberships where user_id in ('${ids.dealer1}', '${ids.dealer2}');
    delete from public.companies where id in ('${ids.company1}', '${ids.company2}');
    delete from auth.users where id in ('${ids.dealer1}', '${ids.dealer2}', '${ids.seller}');
  `);
}

function bidSql(userId, key) {
  return `
    begin;
    set local role authenticated;
    select set_config('request.jwt.claims', '{"sub":"${userId}","role":"authenticated","aal":"aal2"}', true);
    select public.place_bid('${ids.round}', 1000000, '${key}');
    select pg_sleep(1);
    commit;
  `;
}

function runBid(sql) {
  return new Promise((resolve) => {
    const child = spawn("docker", [...psqlArgs, sql], { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (code) => resolve({ code, stderr }));
  });
}

try {
  cleanup();
  psql(`
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) values
      ('00000000-0000-0000-0000-000000000000', '${ids.dealer1}', 'authenticated', 'authenticated', 'race1@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
      ('00000000-0000-0000-0000-000000000000', '${ids.dealer2}', 'authenticated', 'authenticated', 'race2@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', ''),
      ('00000000-0000-0000-0000-000000000000', '${ids.seller}', 'authenticated', 'authenticated', 'race-seller@example.test', '', now(), '{}', '{}', now(), now(), '', '', '', '');
    insert into public.companies (id, legal_name, kvk_number, street, house_number, postal_code, city, contact_name, email, phone, status) values
      ('${ids.company1}', 'Race Dealer Een', '21000001', 'Testweg', '1', '1234AB', 'Testdam', 'Race Een', 'race1@example.test', '0611111111', 'approved'),
      ('${ids.company2}', 'Race Dealer Twee', '21000002', 'Testweg', '2', '1234AB', 'Testdam', 'Race Twee', 'race2@example.test', '0622222222', 'approved');
    insert into public.company_memberships (company_id, user_id, role) values ('${ids.company1}', '${ids.dealer1}', 'owner'), ('${ids.company2}', '${ids.dealer2}', 'owner');
    insert into public.seller_contacts (id, full_name, email, phone, postal_code) values ('${ids.sellerContact}', 'Race Verkoper', 'race-seller@example.test', '0699999999', '9999ZZ');
    insert into public.vehicles (id, registration_normalized, make, model) values ('${ids.vehicle}', 'RC11TE', 'TEST', 'RACE');
    insert into public.applications (id, seller_contact_id, vehicle_id, status) values ('${ids.application}', '${ids.sellerContact}', '${ids.vehicle}', 'ready');
    insert into public.seller_application_access (application_id, user_id) values ('${ids.application}', '${ids.seller}');
    insert into public.vehicle_revisions (id, vehicle_id, revision_number, snapshot) values ('${ids.revision}', '${ids.vehicle}', 1, '{"vehicle":{"registration":"RC11TE"}}');
    insert into public.listings (id, application_id, vehicle_revision_id, status, published_at) values ('${ids.listing}', '${ids.application}', '${ids.revision}', 'published', now());
    insert into public.bid_rounds (id, listing_id, status, starts_at, ends_at, policy_version, rules_snapshot, fee_snapshot) values ('${ids.round}', '${ids.listing}', 'active', now(), now() + interval '24 hours', 1, '{"minimumIncrementCents":5000,"biddingDurationSeconds":86400,"openBidAmounts":true}', '{"configurationConfirmed":false}');
  `);

  const [first, second] = await Promise.all([
    runBid(bidSql(ids.dealer1, "82000000-0000-0000-0000-000000000001")),
    runBid(bidSql(ids.dealer2, "82000000-0000-0000-0000-000000000002")),
  ]);
  const successes = [first, second].filter((result) => result.code === 0).length;
  const rejected = [first, second].filter((result) => result.code !== 0 && result.stderr.includes("bid_below_minimum_increment")).length;
  const bidCount = Number(psql(`select count(*) from public.bids where bid_round_id = '${ids.round}';`).trim());
  if (successes !== 1 || rejected !== 1 || bidCount !== 1) {
    throw new Error(`Gelijktijdigheidstest faalde: successen=${successes}, correct geweigerd=${rejected}, biedingen=${bidCount}.`);
  }
  console.log("PASS: twee gelijktijdige gelijke biedingen leveren exact één opgeslagen bod op.");
} finally {
  cleanup();
}
