import { LEASE_TEXT, NOTICE_DATE, RENT } from "./gold";
import type { ScanHit } from "./types";

export type PlaybookRule = {
  id: string;
  title: string;
  needle: string;
  detail: string;
  costNote: string;
};

/** Costly-clause playbook for a first California apartment lease. Boilerplate is silent. */
export const PLAYBOOK_RULES: PlaybookRule[] = [
  {
    id: "auto-renew",
    title: "60-day automatic renewal",
    needle:
      "Unless Tenant delivers written notice of non-renewal to Landlord at least sixty (60) days",
    detail:
      "If Maya misses written notice, the lease rolls another year with up to an 8% increase.",
    costNote: `Notice must arrive by ${NOTICE_DATE} or the term renews.`,
  },
  {
    id: "pet-fee",
    title: "$400 pet fee",
    needle: "non-refundable pet fee of Four Hundred Dollars ($400.00)",
    detail:
      "The fee is due if any animal is kept, even briefly. First-time renters without a pet can dismiss this.",
    costNote: "$400 non-refundable plus $50 / month if a pet is ever on site.",
  },
  {
    id: "early-term",
    title: "Early termination = two months' rent",
    needle: "early-termination fee equal to two months' rent ($4,800.00)",
    detail:
      "Leaving before 31 August 2027 costs two months of rent unless a replacement is approved.",
    costNote: `$${(RENT * 2).toLocaleString("en-US")} if Maya has to break the lease.`,
  },
  {
    id: "rent-hike",
    title: "Renewal hike up to 8%",
    needle: "automatically renew for one additional year at a rent increase of up to 8%",
    detail:
      "Tied to the auto-renew clause. The 8% cap is the expensive part of staying silent.",
    costNote: `Up to $${Math.round(RENT * 0.08).toLocaleString("en-US")} more per month after ${NOTICE_DATE}.`,
  },
];

export function lookupPlaybook(): {
  audience: string;
  loud: string[];
  silent: string[];
} {
  return {
    audience: "First-apartment renter in California (sample packet: Maya Chen).",
    loud: PLAYBOOK_RULES.map((r) => r.title),
    silent: [
      "Quiet enjoyment",
      "Habitability",
      "Keys and access",
      "Utilities split",
      "Paint",
      "Renters insurance encouragement",
      "Short-stay guests",
      "Governing law / severability / entire agreement",
    ],
  };
}

export function scanLease(text: string = LEASE_TEXT): ScanHit[] {
  const hits: ScanHit[] = [];
  for (const rule of PLAYBOOK_RULES) {
    const at = text.indexOf(rule.needle);
    if (at === -1) continue;
    hits.push({
      ruleId: rule.id,
      title: rule.title,
      detail: rule.detail,
      quote: rule.needle,
      costNote: rule.costNote,
    });
  }
  return hits;
}
