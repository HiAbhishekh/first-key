import { useEffect, useMemo, useState } from "react";
import { bothAgreed, toolsOnStage, WITHHELD_TOOLS } from "./catalog";
import { PacketTools } from "./SiteTools";
import { LISTING, LEASE_TEXT, PARENT, TENANT } from "./gold";
import { downloadText } from "./letter";
import { PLAYBOOK_RULES } from "./playbook";
import { PlaybookCheck } from "./PlaybookCheck";
import { canonicalSummary } from "./eval/score";
import { go } from "./nav";
import { usePacket } from "./store";
import type { Application, Stage } from "./types";

const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: "listing", label: "1. Listing", hint: "Pull terms" },
  { id: "lease", label: "2. Lease", hint: "Clerk scans" },
  { id: "application", label: "3. Application", hint: "Fill form" },
  { id: "outbound", label: "4. Outbound", hint: "Both agree" },
];

const APP_FIELDS: {
  key: Exclude<keyof Application, "humanSubmitted">;
  label: string;
  type: string;
}[] = [
  { key: "fullName",      label: "Full name",           type: "text"  },
  { key: "email",         label: "Email",               type: "email" },
  { key: "phone",         label: "Phone",               type: "tel"   },
  { key: "unit",          label: "Unit",                type: "text"  },
  { key: "moveIn",        label: "Move-in date",        type: "date"  },
  { key: "monthlyIncome", label: "Monthly income ($)",  type: "text"  },
  { key: "hasPet",        label: "Pet in the home?",    type: "text"  },
];

export default function App() {
  const [search, setSearch] = useState(() => window.location.search);
  useEffect(() => {
    const sync = () => setSearch(window.location.search);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const view = new URLSearchParams(search).get("view");
  if (view === "playbook") return <PlaybookCheck />;
  return <Desk />;
}

function WebMCPStatus({ supported }: { supported: boolean }) {
  return (
    <span className={`webmcp-pill ${supported ? "on" : "off"}`}>
      <span className="webmcp-dot" />
      {supported ? "WebMCP active - AI sees live tools" : "No WebMCP - desk works without AI"}
    </span>
  );
}

function Desk() {
  const { packet, dispatch, seat, tabId, highlightId, setHighlightId } =
    usePacket();
  const otherSeat   = seat === "parent" ? "?seat=principal" : "?seat=parent";
  const myName      = seat === "parent" ? PARENT : TENANT;
  const otherName   = seat === "parent" ? TENANT  : PARENT;
  const alreadyThis = seat === "parent" ? packet.agreedParent : packet.agreedPrincipal;
  const sameTab     =
    (seat === "parent"    && packet.agreedPrincipalTab === tabId) ||
    (seat === "principal" && packet.agreedParentTab    === tabId);

  const [webmcpOn, setWebmcpOn] = useState(false);
  useEffect(() => {
    setWebmcpOn(typeof (document as unknown as Record<string, unknown>).modelContext !== "undefined");
  }, []);

  const highlightedQuote = useMemo(() => {
    if (!highlightId) return null;
    return packet.findings.find((f) => f.id === highlightId)?.quote ?? null;
  }, [highlightId, packet.findings]);

  const leaseHtml = useMemo(() => {
    if (!highlightedQuote) return LEASE_TEXT;
    const i = LEASE_TEXT.indexOf(highlightedQuote);
    if (i === -1) return LEASE_TEXT;
    return (
      LEASE_TEXT.slice(0, i) +
      "⟦" + highlightedQuote + "⟧" +
      LEASE_TEXT.slice(i + highlightedQuote.length)
    );
  }, [highlightedQuote]);

  function countersign() {
    if (!packet.outbound || !bothAgreed(packet)) return;
    dispatch({ type: "countersign" });
    downloadText("maya-chen-landlord-letter.txt", packet.outbound.letter, "text/plain");
    downloadText("maya-chen-notice.ics",          packet.outbound.ics,    "text/calendar");
  }

  const clerkTools    = toolsOnStage(packet);
  const canCountersign = Boolean(packet.outbound) && bothAgreed(packet);
  const openN         = packet.findings.filter((f) => f.status === "open").length;
  const acceptedN     = packet.findings.filter((f) => f.status === "accepted").length;
  const playbookScore = canonicalSummary();

  /* Tray step logic */
  const step1Done = Boolean(packet.outbound);
  const step3Done = seat === "parent" ? packet.agreedPrincipal : packet.agreedParent;
  const step4Done = packet.countersigned;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-logo">First Key</span>
          <span className="navbar-tagline">First-apartment AI desk for Maya Chen and Priya Chen</span>
          <div className="navbar-actions">
            <WebMCPStatus supported={webmcpOn} />
            <button
              className="ghost sm"
              onClick={(e) => go("/?view=playbook", e)}
              title="View clerk evaluation scorecard"
            >
              Eval scorecard
            </button>
            <button
              className="ghost sm danger"
              onClick={() => dispatch({ type: "reset" })}
              title="Reset all packet state"
            >
              Reset
            </button>
          </div>
        </div>
      </nav>

      <PacketTools packet={packet} dispatch={dispatch} onJump={setHighlightId} />

      <main className="page">
        <section className="hero-card">
          <div className="hero-copy">
            <div>
              <div className="intro-title">Maya's first apartment</div>
              <p className="intro-sub">
                An AI clerk can read the lease, flag costly clauses, and draft a landlord letter.
                The clerk <strong>cannot</strong> send email, sign anything, or agree on behalf of a person.
                Two humans must agree before the letter downloads.
              </p>
              <p className="intro-disclaimer">Not legal advice.</p>
            </div>
            <div className="hero-proof">
              <div>
                <span className="proof-label">Recall</span>
                <strong>{playbookScore.costlyRecallN}</strong>
              </div>
              <div>
                <span className="proof-label">Silence</span>
                <strong>{playbookScore.silenceN}</strong>
              </div>
              <a href="/?view=playbook" onClick={(e) => go("/?view=playbook", e)}>
                Full evaluation
              </a>
            </div>
          </div>

          <div className="quick-test">
            <div className="quick-title">Judge test path</div>
            <ol>
              <li>Pull listing terms.</li>
              <li>On Lease, ask the AI to run the playbook.</li>
              <li>Accept findings and stage outbound.</li>
              <li>Open the other seat in a second tab. Both agree, then countersign.</li>
            </ol>
          </div>
        </section>

        <div className="seat-banner">
          <span>You are: <span className="seat-you">{myName}</span></span>
          <span className="sep">/</span>
          <a href={otherSeat} target="_blank" rel="noreferrer">
            Open {otherName}'s seat in a new tab
          </a>
          <span className="sep">/</span>
          <span>Both tabs share the same live packet</span>
        </div>

        <div className="stage-bar">
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`stage-btn ${packet.stage === s.id ? "active" : ""}`}
              onClick={() => dispatch({ type: "set-stage", stage: s.id })}
            >
              {s.label}
              <span className="stage-badge">{s.hint}</span>
            </button>
          ))}
        </div>

        <div className="desk-grid">

          <div>
            {packet.stage === "listing" && (
              <div className="listing-card">
                <h2>{LISTING.title}</h2>
                <dl className="listing-meta">
                  <div><dt>Monthly rent</dt><dd>{LISTING.rent}</dd></div>
                  <div><dt>Lease term</dt><dd>{LISTING.term}</dd></div>
                  <div><dt>Security deposit</dt><dd>{LISTING.deposit}</dd></div>
                </dl>
                <p className="listing-note">{LISTING.note}</p>
                <button
                  type="button"
                  className="primary"
                  onClick={() => dispatch({ type: "pull-listing" })}
                >
                  Pull terms into packet
                </button>
                {packet.listingPulled && (
                  <p className="msg-ok" style={{ marginTop: "0.75rem" }}>
                    Listing terms saved to packet. Move to the Lease tab.
                  </p>
                )}
              </div>
            )}

            {packet.stage === "lease" && (
              <div className="lease-card">
                <div className="lease-card-header">
                  <h2>Residential Lease Agreement</h2>
                  {highlightId && (
                    <button className="sm ghost" onClick={() => setHighlightId("")}>
                      Clear highlight
                    </button>
                  )}
                </div>
                <pre className="lease-text">{leaseHtml}</pre>
              </div>
            )}

            {packet.stage === "application" && (
              <div className="app-card">
                <h2 style={{ marginBottom: "1rem" }}>Rental Application</h2>
                <p className="msg-info" style={{ marginBottom: "1rem" }}>
                  This form is filled by Maya (the human). The AI clerk can read it but cannot submit it.
                </p>
                <form
                  className="app-form"
                  onSubmit={(e) => { e.preventDefault(); dispatch({ type: "human-submit" }); }}
                >
                  {APP_FIELDS.map((f) => (
                    <label key={f.key}>
                      {f.label}
                      <input
                        type={f.type}
                        value={String(packet.application[f.key])}
                        onChange={(e) =>
                          dispatch({ type: "fill-application", field: f.key, value: e.target.value })
                        }
                      />
                    </label>
                  ))}
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button type="submit" className="primary">Submit application</button>
                    {packet.application.humanSubmitted && (
                      <span className="msg-ok">Saved - not emailed</span>
                    )}
                  </div>
                </form>
              </div>
            )}

            {packet.stage === "outbound" && (
              <div className="outbound-card">
                <div className="lease-card-header">
                  <h2>Staged outbound letter</h2>
                </div>
                {packet.outbound ? (
                  <pre className="outbound-letter">{packet.outbound.letter}</pre>
                ) : (
                  <div className="outbound-empty">
                    <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Nothing staged yet</p>
                    <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                      Go to the Lease tab, accept findings, then stage outbound.
                      The clerk drafts the letter; it waits here for two humans to agree.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="side-col">

            <div className="tools-panel">
              <div className="card-header">
                <h2>Clerk tools - stage: {packet.stage}</h2>
              </div>
              <div className="tools-section-label">Active now</div>
              <div className="tool-chips">
                {clerkTools.map((name) => (
                  <span key={name} className="chip on">{name}</span>
                ))}
              </div>
              <div className="tools-divider" />
              <div className="tools-section-label">Always withheld (by design)</div>
              <div className="tool-chips">
                {WITHHELD_TOOLS.map((name) => (
                  <span key={name} className="chip never">{name}</span>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Findings</h2>
                <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginLeft: "auto" }}>
                  {openN} open / {acceptedN} accepted
                </span>
              </div>
              <div className="card-body">
                {packet.stage === "lease" && (
                  <button
                    type="button"
                    className="primary"
                    style={{ width: "100%", justifyContent: "center", marginBottom: "0.75rem" }}
                    onClick={() => dispatch({ type: "run-playbook" })}
                  >
                    Run playbook (Clerk)
                  </button>
                )}

                {packet.findings.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", padding: "1.5rem 0" }}>
                    No findings yet. Switch to the Lease tab and run the playbook.
                  </p>
                ) : (
                  <ul className="findings-list" style={{ listStyle: "none", padding: 0 }}>
                    {packet.findings.map((f) => (
                      <li
                        key={f.id}
                        className={`finding ${f.status} ${highlightId === f.id ? "hi" : ""}`}
                      >
                        <div className="finding-head">
                          <span className="finding-title">{f.title}</span>
                          <span className="finding-author">{f.author}</span>
                        </div>
                        <p className="finding-body">{f.detail}</p>
                        <p className="finding-cost">{f.costNote}</p>
                        <div className="finding-actions">
                          <button
                            className="sm"
                            onClick={() => setHighlightId(f.id)}
                            title="Highlight in lease"
                          >
                            Jump
                          </button>
                          <button
                            className="sm accept"
                            onClick={() =>
                              dispatch({ type: "set-finding-status", id: f.id, status: "accepted" })
                            }
                          >
                            Accept
                          </button>
                          <button
                            className="sm dismiss"
                            onClick={() =>
                              dispatch({ type: "set-finding-status", id: f.id, status: "dismissed" })
                            }
                          >
                            Dismiss
                          </button>
                          <span className={`finding-status ${f.status}`}>{f.status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="tray-panel">
              <div className="card-header">
                <h2>Outbound tray</h2>
              </div>
              <div className="tray-steps">

                <div className="tray-step">
                  <div className={`tray-step-num ${step1Done ? "done" : acceptedN > 0 ? "active" : ""}`}>
                    {step1Done ? "OK" : "1"}
                  </div>
                  <div>
                    <div className="tray-step-label">Stage the letter</div>
                    <div className="tray-step-sub">Clerk drafts; no send permission</div>
                    <div className="tray-step-body">
                      <button
                        type="button"
                        disabled={!packet.findings.some((f) => f.status === "accepted")}
                        onClick={() => dispatch({ type: "stage-outbound" })}
                        className="sm"
                      >
                        Stage outbound
                      </button>
                    </div>
                  </div>
                </div>

                <div className="tray-step">
                  <div className={`tray-step-num ${alreadyThis ? "done" : step1Done ? "active" : ""}`}>
                    {alreadyThis ? "OK" : "2"}
                  </div>
                  <div>
                    <div className="tray-step-label">You agree ({myName})</div>
                    <div className="tray-step-sub">This tab only</div>
                    {sameTab && (
                      <p className="msg-warn" style={{ marginTop: "0.4rem" }}>
                        This tab already agreed as the other person.
                      </p>
                    )}
                    <div className="tray-step-body">
                      <button
                        type="button"
                        disabled={!packet.outbound || alreadyThis || sameTab}
                        onClick={() => dispatch({ type: "agree", seat, tabId })}
                        className="sm accept"
                      >
                        I agree - {myName}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="tray-step">
                  <div className={`tray-step-num ${step3Done ? "done" : alreadyThis && !sameTab ? "active" : ""}`}>
                    {step3Done ? "OK" : "3"}
                  </div>
                  <div>
                    <div className="tray-step-label">{otherName} agrees</div>
                    <div className="tray-step-sub">
                      Must be a <strong>different browser tab</strong>
                    </div>
                    {!step3Done && step1Done && (
                      <div className="tray-step-body">
                        <a href={otherSeat} target="_blank" rel="noreferrer">
                          <button className="sm" type="button">Open {otherName}'s tab</button>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="tray-step">
                  <div className={`tray-step-num ${step4Done ? "done" : canCountersign ? "active" : ""}`}>
                    {step4Done ? "OK" : "4"}
                  </div>
                  <div>
                    <div className="tray-step-label">Countersign &amp; download</div>
                    <div className="tray-step-sub">Downloads letter + .ics - not emailed</div>
                    <div className="tray-step-body">
                      <button
                        type="button"
                        className={`sm ${canCountersign ? "primary" : ""}`}
                        disabled={!canCountersign}
                        onClick={countersign}
                      >
                        Countersign and download
                      </button>
                    </div>
                  </div>
                </div>

              </div>
              {packet.countersigned && (
                <div className="card-footer">
                  <span className="msg-ok">Letter and notice downloaded. Still not emailed - by design.</span>
                </div>
              )}
            </div>

            <div className="playbook-panel">
              <div className="card-header">
                <h2>Costly-clause playbook</h2>
              </div>
              <ul className="playbook-items">
                {PLAYBOOK_RULES.map((r) => (
                  <li key={r.id} className="playbook-item">{r.title}</li>
                ))}
              </ul>
              <div className="playbook-score-row">
                <span>Recall <span className="playbook-score-val">{playbookScore.costlyRecallN}</span></span>
                <span>/</span>
                <span>Silence <span className="playbook-score-val">{playbookScore.silenceN}</span></span>
                <span>/</span>
                <a href="/?view=playbook" onClick={(e) => go("/?view=playbook", e)}>
                  Full evaluation
                </a>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
