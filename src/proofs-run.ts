import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WITHHELD_TOOLS } from "./catalog";
import { runProofs } from "./proofs";

const root = dirname(fileURLToPath(import.meta.url));
const siteTools = readFileSync(join(root, "SiteTools.tsx"), "utf8");
const store = readFileSync(join(root, "store.ts"), "utf8");
const useSite = readFileSync(join(root, "useSiteTool.ts"), "utf8");

const failures: string[] = [];

for (const name of WITHHELD_TOOLS) {
  if (siteTools.includes(`name: "${name}"`)) {
    failures.push(`SiteTools registers withheld tool ${name}`);
  }
}

if (!useSite.includes("document.modelContext")) {
  failures.push("useSiteTool does not call document.modelContext");
}

if (!useSite.includes("registerTool")) {
  failures.push("useSiteTool does not call registerTool");
}

if (siteTools.includes("fetch(") || store.includes("fetch(")) {
  failures.push("src has fetch() — a send path must not exist");
}

if (siteTools.includes("mailto:")) {
  failures.push("SiteTools has mailto:");
}

const results = runProofs();
for (const r of results) {
  const mark = r.pass ? "PASS" : "FAIL";
  console.log(`${mark} ${r.id}  ${r.claim}`);
  console.log(`     ${r.detail}`);
  if (!r.pass) failures.push(`Proof ${r.id} failed`);
}

if (failures.length) {
  console.error("\nStructural failures:");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log("\nAll five proofs + withheld-tool source scan passed.");
