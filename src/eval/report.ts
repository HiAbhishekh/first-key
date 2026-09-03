import { canonicalSummary, corpus, pct, scoreCanonical, scoreCorpus, scoreProbe } from "./score";
import type { FixtureScore, Ratio } from "./types";

function fmt(r: Ratio): string {
  return `${r.hits}/${r.total}`.padEnd(8) + pct(r.rate);
}

function pad(value: string, n: number): string {
  return value.length >= n ? value.slice(0, n) : value + " ".repeat(n - value.length);
}

function fixtureLine(s: FixtureScore): string {
  return [
    pad(s.id, 32),
    pad(s.split, 14),
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
  const probe = scoreProbe();
  const lines: string[] = [];

  lines.push("Clerk playbook evaluation");
  lines.push("=========================");
  lines.push("Maya Chen sample lease");
  lines.push(`  costly-clause recall   ${fmt(maya.extractive.recall)}`);
  lines.push(`  precision              ${fmt(maya.extractive.precision)}`);
  lines.push(`  boilerplate silence    ${fmt(maya.silence)}`);
  lines.push(`  deposit                ${canon.deposit}`);
  lines.push("");
  lines.push(`Development (${summary.development.fixtures} leases, spec set)`);
  lines.push(`  costly-clause recall   ${fmt(summary.development.extractiveRecall)}`);
  lines.push(`  precision              ${fmt(summary.development.extractivePrecision)}`);
  lines.push(`  boilerplate silence    ${fmt(summary.development.silence)}`);
  lines.push("");
  lines.push(`Held-out (${summary.heldOut.fixtures} leases, unseen wrapping)`);
  lines.push(`  costly-clause recall   ${fmt(summary.heldOut.extractiveRecall)}`);
  lines.push(`  precision              ${fmt(summary.heldOut.extractivePrecision)}`);
  lines.push(`  boilerplate silence    ${fmt(summary.heldOut.silence)}`);
  lines.push("");
  lines.push(`Adversarial (${summary.adversarial.fixtures} leases)`);
  lines.push(`  costly-clause recall   ${fmt(summary.adversarial.extractiveRecall)}`);
  lines.push(`  precision              ${fmt(summary.adversarial.extractivePrecision)}`);
  lines.push(`  boilerplate silence    ${fmt(summary.adversarial.silence)}`);
  lines.push("");
  lines.push("Paraphrase robustness");
  lines.push(`  all paraphrases        ${fmt(summary.paraphraseAll)}   semantic; expected miss`);
  lines.push(`  mixed paraphrases      ${fmt(summary.paraphraseMixed)}`);
  lines.push("");
  lines.push("Adversarial regression (intentional mutation — not production silence)");
  lines.push(
    `  expected silence        ${probe.silence.ordinary}/${probe.silence.ordinary}  1.00`,
  );
  lines.push(`  probe result           ${fmt(probe.silence)}`);
  lines.push(
    `  status                 FAIL — regression detected (${probe.extractive.fp.join(", ") || "false pin"})`,
  );
  lines.push("");
  lines.push(
    "The playbook is optimized for high-confidence findings and silence, not unrestricted semantic generalization.",
  );
  lines.push("");
  lines.push("  clause                         gold              observed");
  for (const row of maya.rows) {
    const mark = row.ok ? " " : "!";
    lines.push(
      `  ${mark}${pad(row.heading, 30)} ${pad(row.kind, 18)} ${row.note}`,
    );
  }
  lines.push("");
  lines.push("  id                               split          recall          precision       silence         semantic");
  for (const s of summary.fixtures) {
    lines.push("  " + fixtureLine(s));
  }

  return lines.join("\n");
}
