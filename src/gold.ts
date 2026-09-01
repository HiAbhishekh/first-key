/** Sample first-apartment packet for the shared desk. */

export const TENANT = "Maya Chen";
export const PARENT = "Priya Chen";
export const UNIT = "4B, 118 Oak Street, Oakland, CA 94607";
export const LANDLORD = "Harborline Properties LLC";
export const RENT = 2400;
export const TERM_END = "31 August 2027";
export const NOTICE_DATE = "2 July 2027";
export const NOTICE_ICS = "20270702";

export const LISTING = {
  title: "Sunlit one-bed on Oak — first lease, Oakland",
  rent: `$${RENT.toLocaleString("en-US")} / month`,
  term: `1 September 2026 – ${TERM_END}`,
  deposit: `$${RENT.toLocaleString("en-US")} security deposit`,
  note: "Listed as first-time-renter friendly. The lease is on the next stage.",
};

export const LEASE_TEXT = `RESIDENTIAL LEASE AGREEMENT

This Lease is made 1 September 2026 between Harborline Properties LLC ("Landlord") and Maya Chen ("Tenant") for the premises at Unit 4B, 118 Oak Street, Oakland, CA 94607.

1. TERM. The term begins 1 September 2026 and ends 31 August 2027.

2. RENT. Tenant shall pay Two Thousand Four Hundred Dollars ($2,400.00) per month, due on the first calendar day.

3. SECURITY DEPOSIT. Tenant shall deposit $2,400.00 as security. Deductions, if any, shall be itemized as required by California Civil Code.

4. QUIET ENJOYMENT. Landlord covenants that Tenant, paying rent and performing the covenants herein, may quietly enjoy the premises.

5. HABITABILITY. Landlord shall maintain the premises in a habitable condition, including weatherproofing, plumbing, and heat, as required by law.

6. KEYS AND ACCESS. Tenant shall receive two sets of keys. Landlord may enter with reasonable notice except in emergency.

7. UTILITIES. Tenant shall pay electricity and internet. Water and trash are included.

8. PAINT AND ALTERATIONS. Tenant shall not paint or alter the premises without prior written consent.

9. RENTERS INSURANCE. Tenant is encouraged to maintain renters insurance. This clause does not create a Landlord obligation to insure Tenant's property.

10. PETS. If any animal is kept on the premises at any time, Tenant shall pay a non-refundable pet fee of Four Hundred Dollars ($400.00) and an additional $50.00 per month. Landlord's consent is required in writing.

11. GUESTS. Overnight guests of fewer than seven consecutive days are permitted. This is a standard occupancy clause.

12. EARLY TERMINATION. If Tenant vacates before 31 August 2027, Tenant shall pay an early-termination fee equal to two months' rent ($4,800.00), unless a replacement tenant approved by Landlord takes possession.

13. AUTOMATIC RENEWAL. Unless Tenant delivers written notice of non-renewal to Landlord at least sixty (60) days before the end of the term, this Lease shall automatically renew for one additional year at a rent increase of up to 8%. Written notice must be received by 2 July 2027.

14. NOTICES. Notices to Landlord shall be sent to Harborline Properties LLC, 900 Clay Street, Oakland, CA 94607.

15. GOVERNING LAW. This Lease shall be governed by the laws of the State of California.

16. ENTIRE AGREEMENT. This writing, including any addenda, is the entire agreement. Oral promises are not binding.

17. SEVERABILITY. If any clause is unenforceable, the remainder remains in effect.

18. ATTORNEYS' FEES. In any action to enforce this Lease, the prevailing party may recover reasonable attorneys' fees.

SIGNED,

Harborline Properties LLC                    Maya Chen
Landlord                                      Tenant
`;
