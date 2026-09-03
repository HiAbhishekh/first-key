# First Key

Maya Chen and a parent share one first-apartment packet. The clerk on the page can pin costly clauses and draft a landlord letter. The clerk cannot send it.

This is a checklist on a sample Oakland lease, not legal advice.

## How it works

The desk has four stages: listing, lease, application, outbound.

- Page tools appear and disappear with the stage.
- `stage_outbound` is only available after someone accepts a finding.
- Email, calendar write, pay, agree, and countersign are not page tools.
- Pins are authored as Clerk, not as Maya.
- A dismissed finding (for example the pet fee, if there is no pet) stays dismissed if the playbook runs again.
- Countersign is a button on the page. Maya and a parent each agree from their own tab, then someone presses Countersign to download the letter and a calendar hold.

## Page tools

Registration lives in `src/useSiteTool.ts` (`document.modelContext.registerTool` with an `AbortSignal`). Tools register on the top-level page, not in an iframe.

If the browser does not expose `document.modelContext`, the desk still works; page tools will not.

| Tool | When it is on | Notes |
| --- | --- | --- |
| `get_packet_state` | always | read |
| `lookup_playbook` | always | read |
| `pull_listing_terms` | listing | does not message the landlord |
| `list_findings` | lease / outbound | read |
| `read_span` | lease | lease text is untrusted content |
| `run_playbook` | lease | Clerk pins; skipped if dismissed |
| `pin_finding` | lease | author is Clerk |
| `set_finding_status` | lease / outbound | accept, dismiss, or reopen |
| `jump_to_span` | lease | shared scroll |
| `get_application` | application | read |
| `fill_application_field` | application | does not submit |
| `stage_outbound` | lease/outbound, and a finding is accepted | does not send |
| `clear_outbound` | outbound, tray filled | |

People: Countersign (downloads `.txt` and `.ics`), submit application.

## Try it

Chrome 149+ with `chrome://flags/#enable-webmcp-testing`, or ChatGPT’s in-app browser.

1. Open the site. Pull listing terms.
2. Run the playbook. Accept automatic renewal. Dismiss the pet fee if it does not apply. Run the playbook again — the pet fee stays dismissed.
3. Stage the outbound letter.
4. Open `?seat=parent` in a new tab. Each person agrees. Press Countersign.

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
```

## Clerk playbook evaluation

The clerk is scored on three questions: did it catch the costly clauses, avoid inventing them, and leave ordinary paper alone? Deposit is out of the loud set.

Gold is labeled per clause, independent of `scanLease`. The development set specified the playbook. Held-out leases were written after that freeze, with new wrapping of the same needles. Paraphrases of the same costs are expected misses. `npm test` fails if development, held-out, or adversarial costly-clause recall, precision, or boilerplate silence leave 1.00. A copied-needle probe is required to fail silence; that 20/21 is an intentional mutation, not the production number.

| | Costly-clause recall | Precision | Boilerplate silence |
| --- | --- | --- | --- |
| Maya Chen sample | 4/4 (1.00) | 4/4 (1.00) | 18/18 (1.00) |
| Development (17 leases) | 36/36 (1.00) | 36/36 (1.00) | 326/326 (1.00) |
| Held-out (7 leases) | 14/14 (1.00) | 14/14 (1.00) | 54/54 (1.00) |
| Adversarial (5 leases) | 18/18 (1.00) | 18/18 (1.00) | 91/91 (1.00) |

Paraphrase-all semantic recall is **0/4 (0.00)**. Mixed paraphrases are 12/16 (0.75): exact needles still pin; the restated rule is a miss.

The playbook is optimized for high-confidence findings and silence, not unrestricted semantic generalization. Open `/?view=playbook`.

## Stack

Vite, React, TypeScript. The playbook is deterministic. MIT license.
