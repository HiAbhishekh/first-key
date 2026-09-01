import { useMemo } from "react";
import { bothAgreed, toolsOnStage, WITHHELD_TOOLS } from "./catalog";
import { PacketTools } from "./SiteTools";
import { LISTING, LEASE_TEXT, PARENT, TENANT } from "./gold";
import { downloadText } from "./letter";
import { PLAYBOOK_RULES } from "./playbook";
import { usePacket } from "./store";
import type { Application, Stage } from "./types";

const STAGES: { id: Stage; label: string }[] = [
  { id: "listing", label: "Listing" },
  { id: "lease", label: "Lease" },
  { id: "application", label: "Application" },
  { id: "outbound", label: "Outbound" },
];

const APP_FIELDS: {
  key: Exclude<keyof Application, "humanSubmitted">;
  label: string;
  type: string;
}[] = [
  { key: "fullName", label: "Full name", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "unit", label: "Unit", type: "text" },
  { key: "moveIn", label: "Move-in", type: "date" },
  { key: "monthlyIncome", label: "Monthly income", type: "text" },
  { key: "hasPet", label: "Pet in the home (yes/no)", type: "text" },
];

export default function App() {
  return <Desk />;
}

function Desk() {
  const { packet, dispatch, seat, tabId, highlightId, setHighlightId } =
    usePacket();
  const otherSeat = seat === "parent" ? "?seat=principal" : "?seat=parent";
  const alreadyThisSeat =
    seat === "parent" ? packet.agreedParent : packet.agreedPrincipal;
  const sameTabAsOtherSeat =
    (seat === "parent" && packet.agreedPrincipalTab === tabId) ||
    (seat === "principal" && packet.agreedParentTab === tabId);

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
      "⟦" +
      highlightedQuote +
      "⟧" +
      LEASE_TEXT.slice(i + highlightedQuote.length)
    );
  }, [highlightedQuote]);

  function countersign() {
    if (!packet.outbound || !bothAgreed(packet)) return;
    dispatch({ type: "countersign" });
    downloadText("maya-chen-landlord-letter.txt", packet.outbound.letter, "text/plain");
    downloadText("maya-chen-notice.ics", packet.outbound.ics, "text/calendar");
  }

  const clerkTools = toolsOnStage(packet);
  const canCountersign = Boolean(packet.outbound) && bothAgreed(packet);
  const openN = packet.findings.filter((f) => f.status === "open").length;
  const dismissedN = packet.findings.filter((f) => f.status === "dismissed").length;

  return (
    <div className="desk">
      <PacketTools
        packet={packet}
        dispatch={dispatch}
        onJump={setHighlightId}
      />

      <header className="top">
        <div>
          <p className="kicker">First apartment desk</p>
          <h1>First Key</h1>
          <p className="lede">
            Maya Chen and a parent share this packet. The clerk may pin and
            draft. The clerk cannot send.
          </p>
        </div>
        <p className="disclaimer">Not legal advice.</p>
      </header>

      <p className="muted">
        Clerk tools on this stage: {clerkTools.join(", ")}
      </p>
      <div className="permissions" aria-label="Clerk tools on this stage">
        {clerkTools.map((name) => (
          <span key={name} className="perm on">
            {name}
          </span>
        ))}
        {WITHHELD_TOOLS.map((name) => (
          <span key={name} className="perm never">
            {name}
          </span>
        ))}
      </div>

      <nav className="stages">
        {STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={packet.stage === s.id ? "stage active" : "stage"}
            onClick={() => dispatch({ type: "set-stage", stage: s.id })}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <p className="seat">
        You are <strong>{seat === "parent" ? PARENT : TENANT}</strong>
        {" · "}
        <a href={otherSeat} target="_blank" rel="noreferrer">
          Open {seat === "parent" ? "Maya" : "parent"} seat
        </a>
        {" · "}
        two tabs share this packet. Same tab cannot be both people.
      </p>

      <div className="grid">
        <section className="paper">
          {packet.stage === "listing" && (
            <>
              <h2>{LISTING.title}</h2>
              <dl className="meta">
                <div>
                  <dt>Rent</dt>
                  <dd>{LISTING.rent}</dd>
                </div>
                <div>
                  <dt>Term</dt>
                  <dd>{LISTING.term}</dd>
                </div>
                <div>
                  <dt>Deposit</dt>
                  <dd>{LISTING.deposit}</dd>
                </div>
              </dl>
              <p>{LISTING.note}</p>
              <button
                type="button"
                className="primary"
                onClick={() => dispatch({ type: "pull-listing" })}
              >
                Pull terms into packet
              </button>
            </>
          )}

          {packet.stage === "lease" && (
            <>
              <h2>Lease</h2>
              <pre className="lease">{leaseHtml}</pre>
            </>
          )}

          {packet.stage === "application" && (
            <>
              <h2>Application</h2>
              <form
                className="app-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  dispatch({ type: "human-submit" });
                }}
              >
                {APP_FIELDS.map((f) => (
                  <label key={f.key}>
                    {f.label}
                    <input
                      type={f.type}
                      value={String(packet.application[f.key])}
                      onChange={(e) =>
                        dispatch({
                          type: "fill-application",
                          field: f.key,
                          value: e.target.value,
                        })
                      }
                    />
                  </label>
                ))}
                <button type="submit" className="primary">
                  Submit application
                </button>
                {packet.application.humanSubmitted && (
                  <p className="ok">
                    Saved on this page. It was not emailed.
                  </p>
                )}
              </form>
            </>
          )}

          {packet.stage === "outbound" && (
            <>
              <h2>Staged outbound</h2>
              {packet.outbound ? (
                <pre className="lease">{packet.outbound.letter}</pre>
              ) : (
                <p>Accept findings on the lease, then stage. The clerk cannot send.</p>
              )}
            </>
          )}
        </section>

        <section className="side">
          <div className="card">
            <h2>Findings</h2>
            <p className="muted">
              {openN} open · {dismissedN} dismissed · Clerk never signs as Maya
            </p>
            {packet.stage === "lease" && (
              <button
                type="button"
                onClick={() => dispatch({ type: "run-playbook" })}
              >
                Run playbook (Clerk)
              </button>
            )}
            <ul className="findings">
              {packet.findings.map((f) => (
                <li
                  key={f.id}
                  className={highlightId === f.id ? "finding hi" : "finding"}
                >
                  <header>
                    <span className="author">{f.author}</span>
                    <strong>{f.title}</strong>
                  </header>
                  <p>{f.detail}</p>
                  <p className="cost">{f.costNote}</p>
                  <div className="row">
                    <button
                      type="button"
                      onClick={() => setHighlightId(f.id)}
                    >
                      Jump
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "set-finding-status",
                          id: f.id,
                          status: "accepted",
                        })
                      }
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "set-finding-status",
                          id: f.id,
                          status: "dismissed",
                        })
                      }
                    >
                      Dismiss
                    </button>
                    <em>{f.status}</em>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Tray</h2>
            <p className="muted">
              The letter and calendar hold wait here. Countersign downloads
              them.
            </p>
            <button
              type="button"
              disabled={!packet.findings.some((f) => f.status === "accepted")}
              onClick={() => dispatch({ type: "stage-outbound" })}
            >
              Stage outbound
            </button>
            <p className="muted">
              Maya {packet.agreedPrincipal ? "agreed" : "has not agreed"}
              {" · "}
              Parent {packet.agreedParent ? "agreed" : "has not agreed"}
            </p>
            <button
              type="button"
              disabled={!packet.outbound || alreadyThisSeat || sameTabAsOtherSeat}
              onClick={() => dispatch({ type: "agree", seat, tabId })}
            >
              I agree to this letter ({seat === "parent" ? PARENT : TENANT})
            </button>
            <button
              type="button"
              className="primary"
              disabled={!canCountersign}
              onClick={countersign}
            >
              Countersign and download
            </button>
            {sameTabAsOtherSeat && (
              <p className="muted">
                This tab already agreed as the other person. Open the other
                seat in a new tab.
              </p>
            )}
            {packet.outbound && !bothAgreed(packet) && !sameTabAsOtherSeat && (
              <p className="muted">
                Open the other seat in a new tab. Both people need to agree.
              </p>
            )}
            {packet.countersigned && (
              <p className="ok">Downloaded letter + notice date. Still not emailed.</p>
            )}
            <button
              type="button"
              className="ghost"
              onClick={() => dispatch({ type: "reset" })}
            >
              Reset packet
            </button>
          </div>

          <div className="card">
            <h2>Playbook</h2>
            <p className="muted">
              {PLAYBOOK_RULES.length} costly clauses. Ordinary terms stay off
              this list.
            </p>
            <ul className="loud">
              {PLAYBOOK_RULES.map((r) => (
                <li key={r.id}>{r.title}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
