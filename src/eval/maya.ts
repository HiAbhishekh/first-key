import { LEASE_TEXT } from "../gold";
import { PLAYBOOK_RULES } from "../playbook";
import { locateClauses } from "./locate";
import type { ClauseSpec, LabeledLease } from "./types";

type Marker = {
  id: string;
  heading: string;
  start: string;
  kind: ClauseSpec["kind"];
  ruleIds: string[];
};

/**
 * Independent gold for the Maya Chen sample lease.
 * Deposit (clause 3) is ordinary on purpose: one month + Civil Code itemization.
 */
export const MAYA_MARKERS: Marker[] = [
  { id: "title", heading: "Title", start: "RESIDENTIAL LEASE AGREEMENT", kind: "ordinary", ruleIds: [] },
  { id: "preamble", heading: "Preamble", start: "This Lease is made", kind: "ordinary", ruleIds: [] },
  { id: "c1-term", heading: "1. TERM", start: "1. TERM.", kind: "ordinary", ruleIds: [] },
  { id: "c2-rent", heading: "2. RENT", start: "2. RENT.", kind: "ordinary", ruleIds: [] },
  { id: "c3-deposit", heading: "3. SECURITY DEPOSIT", start: "3. SECURITY DEPOSIT.", kind: "ordinary", ruleIds: [] },
  { id: "c4-quiet", heading: "4. QUIET ENJOYMENT", start: "4. QUIET ENJOYMENT.", kind: "ordinary", ruleIds: [] },
  { id: "c5-habitability", heading: "5. HABITABILITY", start: "5. HABITABILITY.", kind: "ordinary", ruleIds: [] },
  { id: "c6-keys", heading: "6. KEYS AND ACCESS", start: "6. KEYS AND ACCESS.", kind: "ordinary", ruleIds: [] },
  { id: "c7-utilities", heading: "7. UTILITIES", start: "7. UTILITIES.", kind: "ordinary", ruleIds: [] },
  { id: "c8-paint", heading: "8. PAINT AND ALTERATIONS", start: "8. PAINT AND ALTERATIONS.", kind: "ordinary", ruleIds: [] },
  { id: "c9-insurance", heading: "9. RENTERS INSURANCE", start: "9. RENTERS INSURANCE.", kind: "ordinary", ruleIds: [] },
  { id: "c10-pets", heading: "10. PETS", start: "10. PETS.", kind: "costly", ruleIds: ["pet-fee"] },
  { id: "c11-guests", heading: "11. GUESTS", start: "11. GUESTS.", kind: "ordinary", ruleIds: [] },
  { id: "c12-early", heading: "12. EARLY TERMINATION", start: "12. EARLY TERMINATION.", kind: "costly", ruleIds: ["early-term"] },
  {
    id: "c13-renewal",
    heading: "13. AUTOMATIC RENEWAL",
    start: "13. AUTOMATIC RENEWAL.",
    kind: "costly",
    ruleIds: ["auto-renew", "rent-hike"],
  },
  { id: "c14-notices", heading: "14. NOTICES", start: "14. NOTICES.", kind: "ordinary", ruleIds: [] },
  { id: "c15-governing", heading: "15. GOVERNING LAW", start: "15. GOVERNING LAW.", kind: "ordinary", ruleIds: [] },
  { id: "c16-entire", heading: "16. ENTIRE AGREEMENT", start: "16. ENTIRE AGREEMENT.", kind: "ordinary", ruleIds: [] },
  { id: "c17-severability", heading: "17. SEVERABILITY", start: "17. SEVERABILITY.", kind: "ordinary", ruleIds: [] },
  { id: "c18-fees", heading: "18. ATTORNEYS' FEES", start: "18. ATTORNEYS' FEES.", kind: "ordinary", ruleIds: [] },
  { id: "signature", heading: "Signature", start: "SIGNED,", kind: "ordinary", ruleIds: [] },
];

export function labelMayaChen(): LabeledLease {
  const specs = splitByMarkers(LEASE_TEXT, MAYA_MARKERS);
  return {
    id: "maya-chen",
    title: "Maya Chen sample lease",
    cohort: "canonical",
    text: LEASE_TEXT,
    clauses: locateClauses(LEASE_TEXT, specs),
  };
}

export function splitByMarkers(text: string, markers: Marker[]): ClauseSpec[] {
  const found = markers.map((m) => {
    const at = text.indexOf(m.start);
    const last = text.lastIndexOf(m.start);
    if (at === -1) {
      throw new Error(`Maya lease is missing marker ${m.id} (${m.start})`);
    }
    if (at !== last) {
      throw new Error(`Maya lease marker ${m.id} is not unique`);
    }
    return { ...m, at };
  });

  for (let i = 1; i < found.length; i++) {
    if (found[i].at <= found[i - 1].at) {
      throw new Error(`Maya lease markers are out of order at ${found[i].id}`);
    }
  }

  if (found[0].at !== 0) {
    throw new Error("Maya lease does not start at the title marker");
  }

  return found.map((m, i) => {
    const end = i + 1 < found.length ? found[i + 1].at : text.length;
    return {
      id: m.id,
      heading: m.heading,
      body: text.slice(m.at, end),
      kind: m.kind,
      ruleIds: [...m.ruleIds],
      semanticRuleIds: [...m.ruleIds],
    };
  });
}

export function mayaOrdinaryCount(): number {
  return MAYA_MARKERS.filter((m) => m.kind === "ordinary").length;
}

export function mayaLoudRuleIds(): string[] {
  return [...new Set(MAYA_MARKERS.flatMap((m) => m.ruleIds))];
}

export function playbookIds(): string[] {
  return PLAYBOOK_RULES.map((r) => r.id);
}
