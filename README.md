# First Key

A shared first-apartment desk. Maya Chen (or her parent) and ChatGPT sit on the same packet. The clerk may pin costly clauses and stage a letter. **The clerk cannot send.** Submit and send are not WebMCP tools.

This is a checklist on a planted lease, not legal advice.

## Why WebMCP

Agents that scrape a lease miss the 60-day auto-renew and then “helpfully” email the landlord. First Key puts the work on the live page:

- Tools register and unregister with the stage (listing → lease → application → outbound).
- `stage_outbound` exists only after a finding is accepted.
- `send`, `send_email`, `submit_application`, and `write_calendar` are never passed to `document.modelContext.registerTool`.
- Pins are authored as **Clerk**, never as Maya.
- Dismissed findings (the $400 pet fee, if she has no pet) do not come back on `run_playbook`.

What was hard before: an agent could propose an irreversible action and also execute it through the DOM. Here the **tool registry** is the lock.

## Judge path (no upload)

1. Open the live URL in ChatGPT’s in-app browser (GPT-5.6 Sol or Terra) or Chrome 149+ with `chrome://flags/#enable-webmcp-testing`.
2. Listing is preloaded. Pull terms (or ask Codex to `pull_listing_terms`).
3. On Lease, run the playbook. Accept auto-renew. Dismiss pet fee. Run playbook again — pet stays dead.
4. Stage outbound. Open **Site tools**: `stage_outbound` is present; **send is not**.
5. Press **Countersign and download** (human). Ask the agent to email Harborline. It cannot.
6. Optional: open `?seat=parent` in a second tab. Same packet.

Eval snapshot: `?view=eval`

## WebMCP usage

Registration is in `src/useSiteTool.ts` — native `document.modelContext.registerTool` with an `AbortSignal`, same lifecycle as [Chrome’s use-webmcp-tool](https://github.com/GoogleChromeLabs/use-webmcp-tool).

ChatGPT Site tools (see [learn.chatgpt.com/docs/webmcp](https://learn.chatgpt.com/docs/webmcp)):

- JavaScript on the **top-level page** only (no iframe, no HTML `toolname` forms).
- Lease text returned by `read_span` is marked `untrustedContentHint` ([tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)).

There is **no polyfill**. If `document.modelContext` is missing, the human UI still works; Site tools will not.

### Tools

| Tool | When registered | Notes |
| --- | --- | --- |
| `get_packet_state` | always | read |
| `lookup_playbook` | always | read |
| `pull_listing_terms` | listing | no landlord message |
| `list_findings` | lease / outbound | read |
| `read_span` | lease | untrusted lease text |
| `run_playbook` | lease | Clerk pins; honors dismissals |
| `pin_finding` | lease | author = Clerk |
| `set_finding_status` | lease / outbound | ledger |
| `jump_to_span` | lease | shared scroll |
| `get_application` | application | read |
| `fill_application_field` | application | no submit |
| `stage_outbound` | lease/outbound **and** an accepted finding | no send |
| `clear_outbound` | outbound with a tray | |

Human only: Countersign (downloads `.txt` + `.ics`), Submit application.

## Local

```bash
npm install
npm run dev
```

```bash
npm run build
```

## Stack

Vite, React, TypeScript. Deterministic playbook (no model in the app). ChatGPT is the agent.

MIT license.
