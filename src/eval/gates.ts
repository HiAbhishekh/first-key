import { LEASE_TEXT } from "../gold";
import { PLAYBOOK_RULES } from "../playbook";
import { labelMayaChen, playbookIds } from "./maya";
import { corpus, pct, ratio, scoreCanonical, scoreCorpus, scoreLease, scoreProbe } from "./score";
import type { EvalGate, FixtureScore, Ratio } from "./types";

function eq1(rate: number): boolean {
  return Math.abs(rate - 1) < 1e-9;
}

function byId(scores: FixtureScore[], id: string): FixtureScore {
  const found = scores.find((s) => s.id === id);
  if (!found) throw new Error(`Missing fixture ${id}`);
  return found;
}

function fmt(r: Ratio): string {
  return `${r.hits}/${r.total} (${pct(r.rate)})`;
}

export function runEvalGates(): EvalGate[] {
  const maya = labelMayaChen();
  const reconstructed = maya.clauses.map((c) => c.body).join("");
  const scoredMaya = scoreCanonical();
  const summary = scoreCorpus();
  const extractive = summary.extractive;
  const development = summary.development;
  const heldOut = summary.heldOut;
  const adversarial = summary.adversarial;
  const paraphraseAll = byId(summary.fixtures, "paraphrase-all");
  const empty = byId(summary.fixtures, "ext-pet0-early0-auto0-hike0");
  const noRenewal = byId(summary.fixtures, "ext-pet1-early1-auto0-hike0");
  const injection = byId(summary.fixtures, "injection-habitability");
  const decoyPet = byId(summary.fixtures, "decoy-pet-sitting");
  const twoMonth = byId(summary.fixtures, "two-month-deposit");
  const probe = scoreProbe();

  const goldIds = playbookIds().slice().sort().join(",");
  const mayaLoud = [...new Set(maya.clauses.flatMap((c) => c.ruleIds))]
    .slice()
    .sort()
    .join(",");

  const ordinaryHasNeedle = maya.clauses
    .filter((c) => c.kind === "ordinary")
    .flatMap((c) =>
      PLAYBOOK_RULES.filter((r) => c.body.includes(r.needle)).map(
        (r) => `${c.id}:${r.id}`,
      ),
    );

  const loudMissingNeedle = maya.clauses
    .filter((c) => c.kind === "costly")
    .flatMap((c) =>
      c.ruleIds.filter((id) => {
        const rule = PLAYBOOK_RULES.find((r) => r.id === id);
        return !rule || !c.body.includes(rule.needle);
      }).map((id) => `${c.id}:${id}`),
    );

  const habitability = injection.rows.find((r) => r.clauseId === "c5-habitability");

  return [
    {
      id: "eval-reconstruct",
      name: "Maya clause gold reconstructs the sample lease",
      pass: reconstructed === LEASE_TEXT,
      detail:
        reconstructed === LEASE_TEXT
          ? `${maya.clauses.length} clauses cover the sample lease exactly.`
          : `Reconstruction length ${reconstructed.length} vs lease ${LEASE_TEXT.length}.`,
    },
    {
      id: "eval-gold-ids",
      name: "Loud gold matches the four playbook rules",
      pass: goldIds === mayaLoud && goldIds === "auto-renew,early-term,pet-fee,rent-hike",
      detail: `playbook=${goldIds} gold=${mayaLoud}. Deposit is ordinary.`,
    },
    {
      id: "eval-needles-in-loud",
      name: "Each loud Maya clause contains its needle",
      pass: loudMissingNeedle.length === 0,
      detail: loudMissingNeedle.length
        ? `Missing ${loudMissingNeedle.join(", ")}`
        : "auto-renew, rent-hike, pet-fee, and early-term sit in the labeled costly clauses.",
    },
    {
      id: "eval-needles-not-in-ordinary",
      name: "Ordinary Maya clauses do not contain a playbook needle",
      pass: ordinaryHasNeedle.length === 0,
      detail: ordinaryHasNeedle.length
        ? `Needle leak ${ordinaryHasNeedle.join(", ")}`
        : `${scoredMaya.silence.ordinary} ordinary clauses have no playbook needle.`,
    },
    {
      id: "eval-canonical",
      name: "Maya Chen costly recall, precision, and silence are 1.00",
      pass:
        eq1(scoredMaya.extractive.recall.rate) &&
        eq1(scoredMaya.extractive.precision.rate) &&
        eq1(scoredMaya.silence.rate) &&
        scoredMaya.extractive.recall.total === 4,
      detail: `recall ${fmt(scoredMaya.extractive.recall)} · precision ${fmt(scoredMaya.extractive.precision)} · silence ${fmt(scoredMaya.silence)}`,
    },
    {
      id: "eval-splits",
      name: "Corpus is split into development, held-out, adversarial, and paraphrase",
      pass:
        development.fixtures === 17 &&
        heldOut.fixtures === 7 &&
        adversarial.fixtures === 5 &&
        summary.paraphrase.fixtures === 5 &&
        summary.fixtures.every((s) => s.id.startsWith("held-") === (s.split === "held-out")),
      detail: `development ${development.fixtures} · held-out ${heldOut.fixtures} · adversarial ${adversarial.fixtures} · paraphrase ${summary.paraphrase.fixtures}`,
    },
    {
      id: "eval-development",
      name: "Development costly-clause recall, precision, and boilerplate silence are 1.00",
      pass:
        eq1(development.extractiveRecall.rate) &&
        eq1(development.extractivePrecision.rate) &&
        eq1(development.silence.rate) &&
        development.extractiveRecall.total === 36,
      detail: `${development.fixtures} leases · recall ${fmt(development.extractiveRecall)} · precision ${fmt(development.extractivePrecision)} · silence ${fmt(development.silence)}`,
    },
    {
      id: "eval-heldout",
      name: "Held-out costly-clause recall, precision, and boilerplate silence are 1.00",
      pass:
        eq1(heldOut.extractiveRecall.rate) &&
        eq1(heldOut.extractivePrecision.rate) &&
        eq1(heldOut.silence.rate) &&
        heldOut.extractiveRecall.total > 0 &&
        heldOut.fixtures === 7,
      detail: `${heldOut.fixtures} leases · recall ${fmt(heldOut.extractiveRecall)} · precision ${fmt(heldOut.extractivePrecision)} · silence ${fmt(heldOut.silence)}`,
    },
    {
      id: "eval-adversarial-split",
      name: "Adversarial costly-clause recall, precision, and boilerplate silence are 1.00",
      pass:
        eq1(adversarial.extractiveRecall.rate) &&
        eq1(adversarial.extractivePrecision.rate) &&
        eq1(adversarial.silence.rate),
      detail: `${adversarial.fixtures} leases · recall ${fmt(adversarial.extractiveRecall)} · precision ${fmt(adversarial.extractivePrecision)} · silence ${fmt(adversarial.silence)}`,
    },
    {
      id: "eval-extractive-corpus",
      name: "All extractive labels (dev + held-out + adversarial) stay at 1.00",
      pass:
        eq1(extractive.extractiveRecall.rate) &&
        eq1(extractive.extractivePrecision.rate) &&
        eq1(extractive.silence.rate) &&
        extractive.extractiveRecall.total > 4,
      detail: `${extractive.fixtures} leases · recall ${fmt(extractive.extractiveRecall)} · precision ${fmt(extractive.extractivePrecision)} · silence ${fmt(extractive.silence)}`,
    },
    {
      id: "eval-boilerplate",
      name: "Lease with no costly needles stays silent",
      pass:
        empty.extractive.got.length === 0 &&
        eq1(empty.silence.rate) &&
        empty.extractive.expected.length === 0,
      detail:
        empty.extractive.got.length === 0
          ? `0 pins on ${empty.silence.ordinary} ordinary clauses.`
          : `Unexpected pins: ${empty.extractive.got.join(", ")}`,
    },
    {
      id: "eval-dropped-renewal",
      name: "Dropping the renewal clause is a measured miss, not a silent pass",
      pass:
        noRenewal.extractive.expected.slice().sort().join(",") === "early-term,pet-fee" &&
        noRenewal.extractive.fn.length === 0 &&
        !noRenewal.extractive.got.includes("auto-renew") &&
        !noRenewal.extractive.got.includes("rent-hike") &&
        eq1(noRenewal.extractive.recall.rate),
      detail: `expected ${noRenewal.extractive.expected.join(", ")} · got ${noRenewal.extractive.got.join(", ")}`,
    },
    {
      id: "eval-injection",
      name: "Instruction-like text in habitability does not create a pin",
      pass: Boolean(habitability?.ok) && eq1(injection.extractive.recall.rate) && eq1(injection.silence.rate),
      detail: habitability
        ? `habitability ${habitability.note} · costly recall ${fmt(injection.extractive.recall)}`
        : "Habitability row missing.",
    },
    {
      id: "eval-decoy-pet",
      name: "A guest pet does not pin the $400 pet fee",
      pass: !decoyPet.extractive.got.includes("pet-fee") && eq1(decoyPet.silence.rate),
      detail: `got ${decoyPet.extractive.got.join(", ") || "nothing"} · silence ${fmt(decoyPet.silence)}`,
    },
    {
      id: "eval-deposit-out",
      name: "Two-month deposit stays out of the loud set",
      pass:
        twoMonth.extractive.recall.total === 4 &&
        eq1(twoMonth.extractive.recall.rate) &&
        eq1(twoMonth.silence.rate) &&
        twoMonth.rows.find((r) => r.clauseId === "c3-deposit")?.ok === true,
      detail: "Deposit is ordinary by design, including two months' rent. Silence holds; the four needles still pin.",
    },
    {
      id: "eval-paraphrase-bound",
      name: "Paraphrased costs are expected misses (extractive bound)",
      pass:
        paraphraseAll.semantic.expected.slice().sort().join(",") ===
          "auto-renew,early-term,pet-fee,rent-hike" &&
        paraphraseAll.semantic.recall.hits === 0 &&
        paraphraseAll.extractive.got.length === 0 &&
        eq1(paraphraseAll.silence.rate),
      detail: `semantic recall ${fmt(paraphraseAll.semantic.recall)} on restated costs. Ordinary clauses stayed quiet.`,
    },
    {
      id: "eval-harness-false-pin",
      name: "Adversarial regression: copied needle into habitability fails silence",
      pass: probe.silence.rate < 1 && probe.extractive.fp.includes("pet-fee"),
      detail: `Intentional mutation, not production silence. Probe ${fmt(probe.silence)} · fp ${probe.extractive.fp.join(", ")}.`,
    },
    {
      id: "eval-harness-forced-miss",
      name: "Recall is 0 when four costly rules are required on boilerplate",
      pass: (() => {
        const boilerplate = corpus().find((l) => l.id === empty.id);
        if (!boilerplate) return false;
        const got = scoreLease(boilerplate).extractive.got;
        const forced = PLAYBOOK_RULES.map((r) => r.id);
        const hits = forced.filter((id) => got.includes(id)).length;
        return ratio(hits, forced.length).rate === 0 && forced.length === 4 && got.length === 0;
      })(),
      detail: (() => {
        const boilerplate = corpus().find((l) => l.id === empty.id);
        const got = boilerplate ? scoreLease(boilerplate).extractive.got : ["missing"];
        const forcedHits = PLAYBOOK_RULES.filter((r) => got.includes(r.id)).length;
        return `Forced recall ${forcedHits}/${PLAYBOOK_RULES.length} on a no-needle lease.`;
      })(),
    },
  ];
}
