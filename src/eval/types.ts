export type Cohort =
  | "canonical"
  | "extractive"
  | "paraphrase"
  | "decoy"
  | "injection"
  | "known-gap"
  | "held-out";

/**
 * development = playbook spec (Maya + exact subsets).
 * held-out = unseen wrapping, authored after that spec was frozen.
 * adversarial = decoys, injection, deposit variants.
 * robustness = paraphrases (expected misses).
 */
export type Split = "development" | "held-out" | "adversarial" | "robustness";

/** ordinary = stay quiet. costly = pin these rule ids. costly-paraphrase = meaning present, needle absent. */
export type ClauseKind = "ordinary" | "costly" | "costly-paraphrase";

export type ClauseSpec = {
  id: string;
  heading: string;
  body: string;
  kind: ClauseKind;
  /** Extractive gold: playbook needles that must fire in this clause. */
  ruleIds: string[];
  /** Human gold: costly meaning in this clause, even if the needle is missing. */
  semanticRuleIds: string[];
};

export type LocatedClause = ClauseSpec & {
  start: number;
  end: number;
};

export type LabeledLease = {
  id: string;
  title: string;
  cohort: Cohort;
  split: Split;
  clauses: LocatedClause[];
  text: string;
};

export type Ratio = {
  hits: number;
  total: number;
  rate: number;
};

export type ClauseRow = {
  clauseId: string;
  heading: string;
  kind: ClauseKind;
  goldRules: string[];
  semanticRules: string[];
  observed: string[];
  ok: boolean;
  note: string;
};

export type FixtureScore = {
  id: string;
  title: string;
  cohort: Cohort;
  split: Split;
  extractive: {
    expected: string[];
    got: string[];
    tp: string[];
    fp: string[];
    fn: string[];
    recall: Ratio;
    precision: Ratio;
  };
  semantic: {
    expected: string[];
    got: string[];
    tp: string[];
    fp: string[];
    fn: string[];
    recall: Ratio;
    precision: Ratio;
  };
  silence: Ratio & {
    ordinary: number;
    quiet: number;
    pinnedHeadings: string[];
  };
  rows: ClauseRow[];
};

export type CohortRollup = {
  cohort: string;
  fixtures: number;
  extractiveRecall: Ratio;
  extractivePrecision: Ratio;
  semanticRecall: Ratio;
  silence: Ratio;
};

export type CorpusSummary = {
  fixtureCount: number;
  development: CohortRollup;
  heldOut: CohortRollup;
  adversarial: CohortRollup;
  extractive: CohortRollup;
  paraphrase: CohortRollup;
  overallExtractive: CohortRollup;
  overallSilence: Ratio;
  paraphraseAll: Ratio;
  paraphraseMixed: Ratio;
  fixtures: FixtureScore[];
};

export type EvalGate = {
  id: string;
  name: string;
  pass: boolean;
  detail: string;
};
