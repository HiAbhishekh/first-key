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

## Stack

Vite, React, TypeScript. The playbook is deterministic. MIT license.
