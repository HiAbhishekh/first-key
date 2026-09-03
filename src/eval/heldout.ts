import { PLAYBOOK_RULES } from "../playbook";
import { assembleLease } from "./locate";
import type { ClauseKind, ClauseSpec, LabeledLease } from "./types";

function needle(id: string): string {
  const rule = PLAYBOOK_RULES.find((r) => r.id === id);
  if (!rule) throw new Error(`Unknown playbook rule ${id}`);
  return rule.needle;
}

function spec(
  id: string,
  heading: string,
  body: string,
  ruleIds: string[],
  semanticRuleIds: string[] = ruleIds,
): ClauseSpec {
  let kind: ClauseKind = "ordinary";
  if (semanticRuleIds.length > 0 && ruleIds.length === semanticRuleIds.length) {
    kind = "costly";
  } else if (semanticRuleIds.length > 0) {
    kind = "costly-paraphrase";
  }
  return { id, heading, body, kind, ruleIds, semanticRuleIds };
}

function pack(id: string, title: string, clauses: ClauseSpec[]): LabeledLease {
  const assembled = assembleLease(clauses);
  return { id, title, cohort: "held-out", split: "held-out", ...assembled };
}

/**
 * Held-out leases. Authored after the Maya + subset corpus was frozen.
 * Unseen wrapping of the same playbook needles — not a semantic generalization set.
 * Gold is declared on each clause here. Do not edit scanLease to chase these.
 */
export function buildHeldOut(): LabeledLease[] {
  return [
    pack("held-richmond-full", "Richmond packet, all four needles, new wrapping", [
      spec("title", "Title", "RESIDENTIAL TENANCY AGREEMENT", [], []),
      spec(
        "preamble",
        "Preamble",
        "This agreement is dated 15 August 2026. Landlord is Redwood Court LLC. Tenant is Jordan Hale. Premises: 9C, 440 Cutting Boulevard, Richmond, CA 94804.",
        [],
        [],
      ),
      spec("term", "A. OCCUPANCY", "A. OCCUPANCY. Twelve months beginning 1 September 2026.", [], []),
      spec("rent", "B. MONTHLY RENT", "B. MONTHLY RENT. Two thousand two hundred fifty dollars, due on the first.", [], []),
      spec(
        "deposit",
        "C. SECURITY",
        "C. SECURITY. One month is held and itemized under California Civil Code.",
        [],
        [],
      ),
      spec("quiet", "D. PEACEABLE USE", "D. PEACEABLE USE. Tenant may occupy without interference if rent is paid.", [], []),
      spec(
        "habitability",
        "E. CONDITION",
        "E. CONDITION. Heat, plumbing, and weatherproofing as required by law.",
        [],
        [],
      ),
      spec(
        "pets",
        "F. ANIMALS",
        `F. ANIMALS. If any animal is kept on the premises at any time, Tenant shall pay a ${needle("pet-fee")} and an additional $50.00 per month.`,
        ["pet-fee"],
      ),
      spec("guests", "G. VISITORS", "G. VISITORS. Guests under ten days need no extra approval.", [], []),
      spec(
        "early",
        "H. LEAVING EARLY",
        `H. LEAVING EARLY. If Tenant vacates before 31 August 2027, Tenant shall pay an ${needle("early-term")}, unless a replacement tenant approved by Landlord takes possession.`,
        ["early-term"],
      ),
      spec(
        "renewal",
        "I. ROLLOVER",
        `I. ROLLOVER. ${needle("auto-renew")} before the end of the term, this Lease shall ${needle("rent-hike")}.`,
        ["auto-renew", "rent-hike"],
      ),
      spec("parking", "J. PARKING", "J. PARKING. One uncovered stall. No storage of inoperable vehicles.", [], []),
      spec("smoking", "K. SMOKING", "K. SMOKING. No smoking in the unit or common hall.", [], []),
      spec("signature", "Signature", "SIGNED, Redwood Court LLC / Jordan Hale", [], []),
    ]),

    pack("held-alameda-quiet", "Alameda packet, no costly needles", [
      spec("title", "Title", "APARTMENT LEASE", [], []),
      spec(
        "preamble",
        "Preamble",
        "Landlord: Estuary Homes, Inc. Tenant: Sam Ortiz. Unit 2A, 1191 Park Street, Alameda, CA 94501. Start date 1 October 2026.",
        [],
        [],
      ),
      spec("term", "1. TERM", "1. TERM. One year. Ends 30 September 2027.", [], []),
      spec("rent", "2. RENT", "2. RENT. $2,100.00 monthly.", [], []),
      spec("deposit", "3. DEPOSIT", "3. DEPOSIT. $2,100.00 security. Itemize deductions as the Civil Code requires.", [], []),
      spec("mail", "4. MAIL", "4. MAIL. Notices go to the on-site office, not to a personal inbox.", [], []),
      spec("hoa", "5. BUILDING RULES", "5. BUILDING RULES. Tenant shall follow posted quiet hours and trash schedules.", [], []),
      spec("renew", "6. NEXT TERM", "6. NEXT TERM. Tenant may request a new term in writing. Landlord may decline.", [], []),
      spec("pets", "7. ANIMALS", "7. ANIMALS. No animals without a separate written addendum. No fee is named here.", [], []),
      spec("signature", "Signature", "SIGNED, Estuary Homes, Inc. / Sam Ortiz", [], []),
    ]),

    pack("held-hayward-pets", "Hayward packet, pet-fee needle only", [
      spec("title", "Title", "LEASE FOR UNIT 12", [], []),
      spec(
        "preamble",
        "Preamble",
        "Mission Ridge Apartments LP lets Unit 12, 25019 Hesperian Boulevard, Hayward, CA 94545, to Priya Nair.",
        [],
        [],
      ),
      spec("term", "TERM", "TERM. 1 September 2026 through 31 August 2027.", [], []),
      spec("rent", "RENT", "RENT. $1,950 per month.", [], []),
      spec(
        "pets",
        "ANIMAL FEE",
        `ANIMAL FEE. Keeping any animal triggers a ${needle("pet-fee")} plus $50.00 each month.`,
        ["pet-fee"],
      ),
      spec("utilities", "UTILITIES", "UTILITIES. Tenant pays power and internet. Water is included.", [], []),
      spec("break", "LEAVING", "LEAVING. Ending the term early requires a written agreement. No preset dollar figure.", [], []),
      spec("signature", "Signature", "SIGNED, Mission Ridge Apartments LP / Priya Nair", [], []),
    ]),

    pack("held-vallejo-renewal", "Vallejo packet, auto-renew and hike needles only", [
      spec("title", "Title", "FIXED-TERM RESIDENTIAL LEASE", [], []),
      spec(
        "preamble",
        "Preamble",
        "Mare Island Housing LLC and Alex Cho for 18 Georgia Street, Vallejo, CA 94590.",
        [],
        [],
      ),
      spec("term", "ARTICLE 1", "ARTICLE 1. The term is one year from 1 September 2026.", [], []),
      spec("rent", "ARTICLE 2", "ARTICLE 2. Rent is $1,800.00.", [], []),
      spec("keys", "ARTICLE 3", "ARTICLE 3. Two keys. Reasonable-notice entry.", [], []),
      spec(
        "renewal",
        "ARTICLE 4",
        `ARTICLE 4. ${needle("auto-renew")} before the end of the term, this Lease shall ${needle("rent-hike")}. Notice must arrive by 2 July 2027.`,
        ["auto-renew", "rent-hike"],
      ),
      spec("pets", "ARTICLE 5", "ARTICLE 5. Animals are barred unless a later addendum says otherwise.", [], []),
      spec("signature", "Signature", "SIGNED, Mare Island Housing LLC / Alex Cho", [], []),
    ]),

    pack("held-sanleandro-early-deposit", "San Leandro packet, early-term needle and two-month deposit", [
      spec("title", "Title", "RENTAL CONTRACT", [], []),
      spec(
        "preamble",
        "Preamble",
        "Bancroft Place LLC rents 733 Estudillo Avenue, San Leandro, CA 94577, to Mei Lin.",
        [],
        [],
      ),
      spec("term", "§1", "§1. Occupancy through 31 August 2027.", [], []),
      spec("rent", "§2", "§2. $2,200.00 monthly rent.", [], []),
      spec(
        "deposit",
        "§3",
        "§3. Tenant deposits $4,400.00 (two months' rent) as security. Itemize under the Civil Code.",
        [],
        [],
      ),
      spec(
        "early",
        "§4",
        `§4. Vacating before 31 August 2027 requires an ${needle("early-term")} unless a replacement tenant approved by Landlord takes possession.`,
        ["early-term"],
      ),
      spec("paint", "§5", "§5. No painting without consent.", [], []),
      spec("signature", "Signature", "SIGNED, Bancroft Place LLC / Mei Lin", [], []),
    ]),

    pack("held-fremont-reordered", "Fremont packet, costly clauses before boilerplate", [
      spec(
        "renewal",
        "ROLLOVER FIRST",
        `ROLLOVER FIRST. ${needle("auto-renew")} before the end of the term, this Lease shall ${needle("rent-hike")}.`,
        ["auto-renew", "rent-hike"],
      ),
      spec(
        "early",
        "EXIT FEE",
        `EXIT FEE. If Tenant vacates before 31 August 2027, Tenant shall pay an ${needle("early-term")}, unless a replacement tenant approved by Landlord takes possession.`,
        ["early-term"],
      ),
      spec(
        "pets",
        "ANIMAL",
        `ANIMAL. If any animal is kept on the premises at any time, Tenant shall pay a ${needle("pet-fee")} and an additional $50.00 per month.`,
        ["pet-fee"],
      ),
      spec(
        "preamble",
        "Parties",
        "After the costly lines: Warm Springs Lofts, LLC and Diego Ruiz, 43855 Fremont Boulevard, Fremont, CA 94538.",
        [],
        [],
      ),
      spec("term", "Dates", "Dates. 1 September 2026 to 31 August 2027.", [], []),
      spec("rent", "Money", "Money. $2,600.00 rent. One month security, Civil Code itemization.", [], []),
      spec("quiet", "Use", "Use. Quiet enjoyment if rent is paid.", [], []),
      spec("signature", "Signature", "SIGNED, Warm Springs Lofts, LLC / Diego Ruiz", [], []),
    ]),

    pack("held-concord-request-renew", "Concord packet, pet and early needles; request-to-renew plus tax 8%", [
      spec("title", "Title", "YEAR LEASE", [], []),
      spec(
        "preamble",
        "Preamble",
        "Treat Boulevard Residences and Nina Park. 4475 Treat Boulevard, Concord, CA 94521.",
        [],
        [],
      ),
      spec("term", "Length", "Length. One year ending 31 August 2027.", [], []),
      spec("rent", "Pay", "Pay. $2,050 on the first of each month.", [], []),
      spec(
        "pets",
        "Pets",
        `Pets. An animal on site means a ${needle("pet-fee")} and $50.00 more per month.`,
        ["pet-fee"],
      ),
      spec(
        "early",
        "Break",
        `Break. Leaving early: ${needle("early-term")}, unless a replacement tenant approved by Landlord takes possession.`,
        ["early-term"],
      ),
      spec(
        "renew",
        "Later term",
        "Later term. Tenant may ask in writing to continue. Landlord does not have to agree. County assessments may rise up to 8%.",
        [],
        [],
      ),
      spec("insurance", "Insurance", "Insurance. Renters coverage is encouraged, not required by this line.", [], []),
      spec("signature", "Signature", "SIGNED, Treat Boulevard Residences / Nina Park", [], []),
    ]),
  ];
}
