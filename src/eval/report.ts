import { canonicalSummary, corpus, pct, scoreCanonical, scoreCorpus } from "./score";
import type { FixtureScore, Ratio } from "./types";

function fmt(r: Ratio): string {
  return `${r.hits}/${r.total}`.padEnd(8) + pct(r.rate);
}

function pad(value: string, n: number): string {
  return value.length >= n ? value.slice(0, n) : value + " ".repeat(n - value.length);
}

function fixtureLine(s: FixtureScore): string {
  return [
    pad(s.id, 28),
    pad(s.cohort, 12),
    fmt(s.extractive.recall),
    "  ",
    fmt(s.extractive.precision),
    "  ",
    fmt(s.silence),
    "  ",
    fmt(s.semantic.recall),
  ].join("");
}

export function formatPlaybookReport(): string {
  const maya = scoreCanonical();
  const summary = scoreCorpus(corpus());
  const canon = canonicalSummary();
  const lines: string[] = [];

  lines.push("Playbook check");
  lines.push("==============");
  lines.push(`Maya Chen sample lease`);
  lines.push(`  costly recall   ${fmt(maya.extractive.recall)}`);
  lines.push(`  precision       ${fmt(maya.extractive.precision)}`);
  lines.push(`  silence         ${fmt(maya.silence)}`);
  lines.push(`  deposit         ${canon.deposit}`);
  lines.push("");
  lines.push("  clause                         gold              observed");
  for (const row of maya.rows) {
    const mark = row.ok ? " " : "!";
    lines.push(
      `  ${mark}${pad(row.heading, 30)} ${pad(row.kind, 18)} ${row.note}`,
    );
  }

  lines.push("");
  lines.push(`Labeled corpus (${summary.fixtureCount} leases)`);
  lines.push(
    `  extractive recall      ${fmt(summary.extractive.extractiveRecall)}   across ${summary.extractive.fixtures} non-paraphrase leases`,
  );
  lines.push(`  extractive precision   ${fmt(summary.extractive.extractivePrecision)}`);
  lines.push(`  silence                ${fmt(summary.extractive.silence)}`);
  lines.push(
    `  paraphrase-all         ${fmt(summary.paraphraseAll)}   semantic recall; restated costs, no needles`,
  );
  lines.push(
    `  mixed paraphrases      ${fmt(summary.paraphraseMixed)}   exact needles still pin; paraphrased rule missed`,
  );
  lines.push("");
  lines.push("  id                           cohort       recall          precision       silence         semantic");
  for (const s of summary.fixtures) {
    lines.push("  " + fixtureLine(s));
  }

  return lines.join("\n");
}
