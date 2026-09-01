import { PLAYBOOK_RULES, scanLease } from "../playbook";
import { LEASE_TEXT } from "../gold";

export function scorePlantedLease() {
  const hits = scanLease(LEASE_TEXT);
  const expected = PLAYBOOK_RULES.map((r) => r.id);
  const got = hits.map((h) => h.ruleId);
  const missing = expected.filter((id) => !got.includes(id));
  const extra = got.filter((id) => !expected.includes(id));
  const silence =
    LEASE_TEXT.split(/\n\n+/).filter((b) => b.trim().length > 40).length -
    hits.length;

  return {
    recall: missing.length === 0 && extra.length === 0 ? 1 : got.length / expected.length,
    expected,
    got,
    missing,
    extra,
    silentBlocksApprox: Math.max(0, silence),
    note: "Deterministic playbook on the planted Maya Chen lease. Not an LLM eval yet.",
  };
}
