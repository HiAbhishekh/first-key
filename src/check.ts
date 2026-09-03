import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WITHHELD_TOOLS } from "./catalog";
import { runChecks } from "./checks";
import { runEvalGates } from "./eval/gates";
import { formatPlaybookReport } from "./eval/report";

const root = dirname(fileURLToPath(import.meta.url));
const siteTools = readFileSync(join(root, "SiteTools.tsx"), "utf8");
const store = readFileSync(join(root, "store.ts"), "utf8");
const useSite = readFileSync(join(root, "useSiteTool.ts"), "utf8");

const failures: string[] = [];

for (const name of WITHHELD_TOOLS) {
  if (siteTools.includes(`name: "${name}"`)) {
    failures.push(`SiteTools registers ${name}`);
  }
}

if (!useSite.includes("document.modelContext")) {
  failures.push("useSiteTool does not call document.modelContext");
}

if (!useSite.includes("registerTool")) {
  failures.push("useSiteTool does not call registerTool");
}

if (siteTools.includes("fetch(") || store.includes("fetch(")) {
  failures.push("unexpected fetch() in src");
}

if (siteTools.includes("mailto:")) {
  failures.push("SiteTools has mailto:");
}

console.log(formatPlaybookReport());
console.log("");

const results = [...runEvalGates(), ...runChecks()];
for (const r of results) {
  const mark = r.pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${r.name}`);
  console.log(`     ${r.detail}`);
  if (!r.pass) failures.push(`${r.id} failed`);
}

if (failures.length) {
  console.error("\nFailures:");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log("\nChecks passed.");
