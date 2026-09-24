import { spawnSync } from "node:child_process";
import path from "node:path";

const cli = path.resolve("node_modules/@playwright/test/cli.js");
const result = spawnSync(
  process.execPath,
  ["--env-file=.env.local", cli, "test", "e2e/authenticated-workflow.spec.ts"],
  {
    cwd: process.cwd(),
    env: { ...process.env, E2E_ACCEPTANCE: "true" },
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
