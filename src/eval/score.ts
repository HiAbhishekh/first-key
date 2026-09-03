import { PLAYBOOK_RULES, scanLease } from "../playbook";
import type { ScanHit } from "../types";
import { buildCorpus, leaseNeedleInHabitability } from "./corpus";
import { labelMayaChen, mayaLoudRuleIds, playbookIds } from "./maya";
import type {
  ClauseRow,
  CohortRollup,
  CorpusSummary,
  FixtureScore,
  LabeledLease,
  LocatedClause,
  Ratio,
} from "./types";

export function ratio(hits: number, total: number): Ratio {
  return {
    hits,
    total,
    rate: total === 0 ? 1 : hits / total,
  };
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}

function hitsForClause(text: string, clause: LocatedClause, hits: ScanHit[]): ScanHit[] {
  return hits.filter((h) => {
    const at = text.indexOf(h.quote);
    return at >= clause.start && at < clause.end;
  });
}

export function scoreLease(lease: LabeledLease): FixtureScore {
  const hits = scanLease(lease.text);
  const got = hits.map((h) => h.ruleId);
  const extractiveExpected = unique(lease.clauses.flatMap((c) => c.ruleIds));
  const semanticExpected = unique(lease.clauses.flatMap((c) => c.semanticRuleIds));

  const tp = extractiveExpected.filter((id) => got.includes(id));
  const fn = extractiveExpected.filter((id) => !got.includes(id));
  const fp = got.filter((id) => !extractiveExpected.includes(id));

  const semTp = semanticExpected.filter((id) => got.includes(id));
  const semFn = semanticExpected.filter((id) => !got.includes(id));
  const semFp = got.filter((id) => !semanticExpected.includes(id));

  const ordinary = lease.clauses.filter((c) => c.kind === "ordinary");
  const pinnedOrdinary = ordinary.filter(
    (c) => hitsForClause(lease.text, c, hits).length > 0,
  );

  const rows: ClauseRow[] = lease.clauses.map((c) => {
    const observed = hitsForClause(lease.text, c, hits).map((h) => h.ruleId);
    let ok = true;
    let note = "quiet";
    if (c.kind === "ordinary") {
      ok = observed.length === 0;
      note = ok ? "quiet" : `false pin ${observed.join(", ")}`;
    } else if (c.kind === "costly") {
      const missing = c.ruleIds.filter((id) => !observed.includes(id));
      const extra = observed.filter((id) => !c.semanticRuleIds.includes(id));
      ok = missing.length === 0 && extra.length === 0;
      note = ok ? observed.join(", ") : `missing ${missing.join(", ") || "—"} extra ${extra.join(", ") || "—"}`;
    } else {
      const missingExtractive = c.ruleIds.filter((id) => !observed.includes(id));
      const extra = observed.filter((id) => !c.semanticRuleIds.includes(id));
      ok = missingExtractive.length === 0 && extra.length === 0;
      const missingSemantic = c.semanticRuleIds.filter((id) => !observed.includes(id));
      note = missingSemantic.length
        ? `paraphrase miss ${missingSemantic.join(", ")}${observed.length ? `; pinned ${observed.join(", ")}` : ""}`
        : observed.join(", ");
    }
    return {
      clauseId: c.id,
      heading: c.heading,
      kind: c.kind,
      goldRules: c.ruleIds,
      semanticRules: c.semanticRuleIds,
      observed,
      ok,
      note,
    };
  });

  return {
    id: lease.id,
    title: lease.title,
    cohort: lease.cohort,
    split: lease.split,
    extractive: {
      expected: extractiveExpected,
      got,
      tp,
      fp,
      fn,
      recall: ratio(tp.length, extractiveExpected.length),
      precision: ratio(tp.length, got.length),
    },
    semantic: {
      expected: semanticExpected,
      got,
      tp: semTp,
      fp: semFp,
      fn: semFn,
      recall: ratio(semTp.length, semanticExpected.length),
      precision: ratio(semTp.length, got.length),
    },
    silence: {
      ...ratio(ordinary.length - pinnedOrdinary.length, ordinary.length),
      ordinary: ordinary.length,
      quiet: ordinary.length - pinnedOrdinary.length,
      pinnedHeadings: pinnedOrdinary.map((c) => c.heading),
    },
    rows,
  };
}

function addRatios(parts: Ratio[]): Ratio {
  const hits = parts.reduce((n, r) => n + r.hits, 0);
  const total = parts.reduce((n, r) => n + r.total, 0);
  return ratio(hits, total);
}

function rollup(name: string, scores: FixtureScore[]): CohortRollup {
  return {
    cohort: name,
    fixtures: scores.length,
    extractiveRecall: addRatios(scores.map((s) => s.extractive.recall)),
    extractivePrecision: addRatios(scores.map((s) => s.extractive.precision)),
    semanticRecall: addRatios(scores.map((s) => s.semantic.recall)),
    silence: addRatios(scores.map((s) => s.silence)),
  };
}

let corpusCache: LabeledLease[] | null = null;

export function corpus(): LabeledLease[] {
  corpusCache ??= buildCorpus();
  return corpusCache;
}

export function scoreCorpus(leases: LabeledLease[] = corpus()): CorpusSummary {
  const fixtures = leases.map(scoreLease);
  const development = fixtures.filter((s) => s.split === "development");
  const heldOut = fixtures.filter((s) => s.split === "held-out");
  const adversarial = fixtures.filter((s) => s.split === "adversarial");
  const extractive = fixtures.filter((s) => s.split !== "robustness");
  const paraphrase = fixtures.filter((s) => s.split === "robustness");
  const paraphraseAll = fixtures.find((s) => s.id === "paraphrase-all");
  const paraphraseMixed = paraphrase.filter((s) => s.id !== "paraphrase-all");
  return {
    fixtureCount: fixtures.length,
    development: rollup("development", development),
    heldOut: rollup("held-out", heldOut),
    adversarial: rollup("adversarial", adversarial),
    extractive: rollup("extractive-labels", extractive),
    paraphrase: rollup("paraphrase", paraphrase),
    overallExtractive: rollup("all-extractive-labels", fixtures),
    overallSilence: addRatios(fixtures.map((s) => s.silence)),
    paraphraseAll: paraphraseAll?.semantic.recall ?? ratio(0, 0),
    paraphraseMixed: addRatios(paraphraseMixed.map((s) => s.semantic.recall)),
    fixtures,
  };
}

export function scoreProbe(): FixtureScore {
  return scoreLease(leaseNeedleInHabitability());
}

export function scoreCanonical(): FixtureScore {
  return scoreLease(labelMayaChen());
}

export function canonicalSummary() {
  const scored = scoreCanonical();
  const loud = mayaLoudRuleIds();
  return {
    fixture: scored.id,
    costlyRules: PLAYBOOK_RULES.map((r) => r.id),
    deposit: "out of the loud set (ordinary, including one month with Civil Code itemization)",
    costlyRecall: scored.extractive.recall.rate,
    costlyRecallN: `${scored.extractive.recall.hits}/${scored.extractive.recall.total}`,
    precision: scored.extractive.precision.rate,
    precisionN: `${scored.extractive.precision.hits}/${scored.extractive.precision.total}`,
    silence: scored.silence.rate,
    silenceN: `${scored.silence.quiet}/${scored.silence.ordinary}`,
    note: "The clerk uses a bounded playbook for high-confidence findings and silence, not unrestricted semantic generalization. Full table at ?view=playbook.",
    playbookMatchesGold: playbookIds().every((id) => loud.includes(id)) && loud.length === playbookIds().length,
  };
}

export function pct(rate: number): string {
  return rate.toFixed(2);
}
