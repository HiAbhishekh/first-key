import { PLAYBOOK_RULES, scanLease } from "./playbook";
import { emptyPacket, reduce, type Action } from "./store";
import { bothAgreed, toolsOnStage, WITHHELD_TOOLS } from "./catalog";
import type { Packet } from "./types";

export type CheckResult = {
  id: string;
  name: string;
  pass: boolean;
  detail: string;
};

function play(actions: Action[]): Packet {
  return actions.reduce(reduce, emptyPacket());
}

function pet(packet: Packet) {
  return packet.findings.find((f) => f.ruleId === "pet-fee");
}

function autoRenew(packet: Packet) {
  return packet.findings.find((f) => f.ruleId === "auto-renew");
}

/** Packet reducers used by the page-tool handlers. */
export function runChecks(): CheckResult[] {
  const scanned = scanLease();

  const afterPull = play([{ type: "pull-listing" }]);
  const afterScan = reduce(afterPull, { type: "run-playbook" });
  const petFinding = pet(afterScan);
  const auto = autoRenew(afterScan);

  const pins: CheckResult = {
    id: "pins",
    name: "Playbook pins costly clauses as Clerk",
    pass:
      afterPull.stage === "lease" &&
      afterScan.findings.length === PLAYBOOK_RULES.length &&
      afterScan.findings.every((f) => f.author === "clerk") &&
      scanned.length === PLAYBOOK_RULES.length,
    detail:
      afterScan.findings.length === PLAYBOOK_RULES.length
        ? `run_playbook pinned ${afterScan.findings.length} clauses.`
        : `Expected ${PLAYBOOK_RULES.length} pins, got ${afterScan.findings.length}.`,
  };

  if (!petFinding || !auto) {
    return [
      pins,
      {
        id: "dismiss",
        name: "Dismissed findings stay dismissed",
        pass: false,
        detail: "Playbook did not pin pet-fee and auto-renew.",
      },
      {
        id: "tools",
        name: "Tools follow the stage",
        pass: false,
        detail: "Blocked on pins.",
      },
      {
        id: "no-send",
        name: "Send and countersign are not page tools",
        pass: false,
        detail: "Blocked on pins.",
      },
      {
        id: "two-seats",
        name: "Countersign needs two seats",
        pass: false,
        detail: "Blocked on pins.",
      },
    ];
  }

  const dismissed = reduce(afterScan, {
    type: "set-finding-status",
    id: petFinding.id,
    status: "dismissed",
  });
  const rerun = reduce(dismissed, { type: "run-playbook" });
  const petAfter = pet(rerun);

  const dismiss: CheckResult = {
    id: "dismiss",
    name: "Dismissed findings stay dismissed",
    pass:
      petAfter?.status === "dismissed" &&
      rerun.findings.filter((f) => f.ruleId === "pet-fee").length === 1,
    detail:
      petAfter?.status === "dismissed" &&
      rerun.findings.filter((f) => f.ruleId === "pet-fee").length === 1
        ? "Pet fee stayed dismissed after a second run_playbook."
        : `After re-run, pet status=${petAfter?.status}, count=${rerun.findings.filter((f) => f.ruleId === "pet-fee").length}.`,
  };

  const listingTools = toolsOnStage(emptyPacket());
  const leaseTools = toolsOnStage(afterScan);
  const accepted = reduce(rerun, {
    type: "set-finding-status",
    id: auto.id,
    status: "accepted",
  });
  const leaseWithStage = toolsOnStage(accepted);
  const appPacket = reduce(accepted, { type: "set-stage", stage: "application" });
  const appTools = toolsOnStage(appPacket);

  const tools: CheckResult = {
    id: "tools",
    name: "Tools follow the stage",
    pass:
      listingTools.includes("pull_listing_terms") &&
      !listingTools.includes("run_playbook") &&
      leaseTools.includes("run_playbook") &&
      !leaseTools.includes("pull_listing_terms") &&
      !leaseTools.includes("stage_outbound") &&
      leaseWithStage.includes("stage_outbound") &&
      appTools.includes("fill_application_field") &&
      !appTools.includes("run_playbook") &&
      !appTools.includes("submit_application" as never),
    detail: `listing=${listingTools.join(", ")} | lease=${leaseTools.join(", ")} | application=${appTools.join(", ")}`,
  };

  const staged = reduce(accepted, { type: "stage-outbound" });
  const earlyCountersign = reduce(staged, { type: "countersign" });
  const withheldNeverOn = WITHHELD_TOOLS.every(
    (name) => !toolsOnStage(staged).includes(name as never),
  );
  const withheldOnEveryStage = (
    ["listing", "lease", "application", "outbound"] as const
  ).every((stage) => {
    const p = { ...staged, stage };
    return WITHHELD_TOOLS.every(
      (name) => !toolsOnStage(p).includes(name as never),
    );
  });

  const noSend: CheckResult = {
    id: "no-send",
    name: "Send and countersign are not page tools",
    pass:
      withheldNeverOn &&
      withheldOnEveryStage &&
      !toolsOnStage(staged).includes("send" as never) &&
      earlyCountersign.countersigned === false &&
      staged.outbound !== null,
    detail: earlyCountersign.countersigned
      ? "Countersign ran before both seats agreed."
      : "send, agree, and countersign stay off the stage list. Countersign waits for both seats.",
  };

  const onlyMaya = reduce(staged, {
    type: "agree",
    seat: "principal",
    tabId: "tab-maya",
  });
  const stillLocked = reduce(onlyMaya, { type: "countersign" });
  const sameTabParent = reduce(onlyMaya, {
    type: "agree",
    seat: "parent",
    tabId: "tab-maya",
  });
  const sameTabStillLocked = reduce(sameTabParent, { type: "countersign" });
  const both = reduce(onlyMaya, {
    type: "agree",
    seat: "parent",
    tabId: "tab-priya",
  });
  const released = reduce(both, { type: "countersign" });

  const twoSeats: CheckResult = {
    id: "two-seats",
    name: "Countersign needs two seats",
    pass:
      !bothAgreed(staged) &&
      !bothAgreed(onlyMaya) &&
      stillLocked.countersigned === false &&
      !bothAgreed(sameTabParent) &&
      sameTabStillLocked.countersigned === false &&
      bothAgreed(both) &&
      released.countersigned === true &&
      both.agreedPrincipalTab !== both.agreedParentTab,
    detail:
      bothAgreed(both) &&
      released.countersigned &&
      !stillLocked.countersigned &&
      !sameTabStillLocked.countersigned
        ? "One seat cannot countersign. Two tabs can."
        : `mayaOnly=${stillLocked.countersigned} sameTab=${sameTabStillLocked.countersigned} both=${bothAgreed(both)} released=${released.countersigned}`,
  };

  return [pins, dismiss, tools, noSend, twoSeats];
}
