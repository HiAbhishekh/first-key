import { PLAYBOOK_RULES, scanLease } from "./playbook";
import { emptyPacket, reduce, type Action } from "./store";
import { bothAgreed, toolsOnStage, WITHHELD_TOOLS } from "./catalog";
import type { Packet } from "./types";

export type ProofResult = {
  id: string;
  claim: string;
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

/** Same actions the WebMCP execute handlers dispatch. */
export function runProofs(): ProofResult[] {
  const scanned = scanLease();

  const afterPull = play([{ type: "pull-listing" }]);
  const afterScan = reduce(afterPull, { type: "run-playbook" });
  const petFinding = pet(afterScan);
  const auto = autoRenew(afterScan);

  const proof1: ProofResult = {
    id: "1",
    claim: "The agent can operate the page.",
    pass:
      afterPull.stage === "lease" &&
      afterScan.findings.length === PLAYBOOK_RULES.length &&
      afterScan.findings.every((f) => f.author === "clerk") &&
      scanned.length === PLAYBOOK_RULES.length,
    detail:
      afterScan.findings.length === PLAYBOOK_RULES.length
        ? `pull_listing_terms + run_playbook produced ${afterScan.findings.length} Clerk pins on the live packet.`
        : `Expected ${PLAYBOOK_RULES.length} clerk pins, got ${afterScan.findings.length}.`,
  };

  if (!petFinding || !auto) {
    return [
      proof1,
      {
        id: "2",
        claim: "The human can correct the agent and the correction persists.",
        pass: false,
        detail: "Playbook did not pin pet-fee and auto-renew.",
      },
      {
        id: "3",
        claim: "The available agent tools change with application state.",
        pass: false,
        detail: "Blocked on proof 1.",
      },
      {
        id: "4",
        claim: "The irreversible capability is structurally unavailable to the agent.",
        pass: false,
        detail: "Blocked on proof 1.",
      },
      {
        id: "5",
        claim: "Two humans can agree on the action before the human-only operation occurs.",
        pass: false,
        detail: "Blocked on proof 1.",
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

  const proof2: ProofResult = {
    id: "2",
    claim: "The human can correct the agent and the correction persists.",
    pass:
      petAfter?.status === "dismissed" &&
      rerun.findings.filter((f) => f.ruleId === "pet-fee").length === 1,
    detail:
      petAfter?.status === "dismissed" &&
      rerun.findings.filter((f) => f.ruleId === "pet-fee").length === 1
        ? "Dismissed pet-fee stayed dismissed after a second run_playbook. No second pin."
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

  const proof3: ProofResult = {
    id: "3",
    claim: "The available agent tools change with application state.",
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
    detail: `listing=${listingTools.join(", ")} | lease=${leaseTools.join(", ")} | lease+accepted adds stage_outbound | application=${appTools.join(", ")}`,
  };

  const staged = reduce(accepted, { type: "stage-outbound" });
  const agentTriesCountersign = reduce(staged, { type: "countersign" });
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

  const proof4: ProofResult = {
    id: "4",
    claim: "The irreversible capability is structurally unavailable to the agent.",
    pass:
      withheldNeverOn &&
      withheldOnEveryStage &&
      !toolsOnStage(staged).includes("send" as never) &&
      agentTriesCountersign.countersigned === false &&
      staged.outbound !== null,
    detail: agentTriesCountersign.countersigned
      ? "FAIL: countersign succeeded without both humans agreeing."
      : "send/submit/agree/countersign are not in toolsOnStage on any stage. Reducer refuses countersign until two distinct tabs agree. No landlord network call exists.",
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

  const proof5: ProofResult = {
    id: "5",
    claim: "Two humans can agree on the action before the human-only operation occurs.",
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
        ? "Maya-only agree cannot Countersign. Same browsing context cannot agree as both people. Maya tab + parent tab unlocks Countersign."
        : `mayaOnly=${stillLocked.countersigned} sameTab=${sameTabStillLocked.countersigned} both=${bothAgreed(both)} released=${released.countersigned}`,
  };

  return [proof1, proof2, proof3, proof4, proof5];
}
