import {
  NOTICE_DATE,
  NOTICE_ICS,
  TENANT,
  UNIT,
} from "./gold";
import type { Finding } from "./types";

export function buildLetter(accepted: Finding[]): string {
  const asks = accepted
    .filter((f) => f.ruleId !== "pet-fee")
    .map((f) => `- ${f.title}: ${f.costNote}`)
    .join("\n");

  const pet = accepted.find((f) => f.ruleId === "pet-fee");
  const petLine = pet
    ? `\nI do not intend to keep a pet. Please confirm the $400 pet fee does not apply.\n`
    : "";

  return `Harborline Properties LLC
900 Clay Street
Oakland, CA 94607

Re: Unit ${UNIT} — questions before countersignature

I am Maya Chen. I intend to sign, and I need written confirmation on the following before I do:

${asks || "- (no accepted clauses — add findings first)"}
${petLine}
Please confirm that a written non-renewal received by ${NOTICE_DATE} will prevent automatic renewal.

This letter is a checklist of questions, not legal advice.

Sincerely,
${TENANT}
`;
}

export function buildIcs(): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//First Key//Lease notice//EN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${NOTICE_ICS}`,
    `DTEND;VALUE=DATE:${NOTICE_ICS}`,
    "SUMMARY:Last day to send Harborline non-renewal notice (Maya Chen lease)",
    `DESCRIPTION:Written notice due ${NOTICE_DATE} or the Oak Street lease auto-renews.`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadText(filename: string, body: string, type: string) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
