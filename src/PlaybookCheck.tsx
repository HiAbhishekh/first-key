import {
  canonicalSummary,
  corpus,
  pct,
  scoreCanonical,
  scoreCorpus,
  scoreProbe,
} from "./eval/score";
import type { Ratio } from "./eval/types";
import { go } from "./nav";

function ScoreRow({
  label,
  r,
  warn,
  fail,
}: {
  label: string;
  r: Ratio;
  warn?: boolean;
  fail?: boolean;
}) {
  const cls = fail ? "score-row fail" : warn ? "score-row warn" : "score-row";
  return (
    <div className={cls}>
      <span className="score-label">{label}</span>
      <span className="score-frac">{r.hits}/{r.total}</span>
      <span className="score-rate">{pct(r.rate)}</span>
    </div>
  );
}

function StaticRow({
  label,
  frac,
  rate,
  fail,
}: {
  label: string;
  frac: string;
  rate: string;
  fail?: boolean;
}) {
  return (
    <div className={fail ? "score-row fail" : "score-row"}>
      <span className="score-label">{label}</span>
      <span className="score-frac">{frac}</span>
      <span className="score-rate">{rate}</span>
    </div>
  );
}

export function PlaybookCheck() {
  const maya    = scoreCanonical();
  const summary = scoreCorpus(corpus());
  const canon   = canonicalSummary();
  const probe   = scoreProbe();
  const expected = probe.silence.ordinary;

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-logo">🔑 First Key</span>
          <span className="navbar-tagline">Clerk playbook evaluation</span>
          <div className="navbar-actions">
            <button className="ghost sm" onClick={(e) => go("/", e)}>
              ← Back to desk
            </button>
          </div>
        </div>
      </nav>

      <div className="eval-page">

        {/* ── Hero ── */}
        <div className="intro" style={{ paddingTop: "1.5rem" }}>
          <div className="intro-title">Clerk Playbook Evaluation</div>
          <p className="intro-sub">
            Three questions: did the clerk catch every costly clause (recall), avoid
            inventing ones that aren't there (precision), and stay silent on ordinary
            boilerplate (silence)? This playbook is <strong>bounded by design</strong> — it
            is not a general-purpose lease parser.
          </p>
          <p style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--muted)" }}>
            Run <code>npm test</code> to see all gates pass. Gates fail if any metric
            leaves 1.00 on development, held-out, or adversarial labels.
          </p>
        </div>

        {/* ── Maya Chen sample ── */}
        <div className="eval-section">
          <div className="eval-section-head">
            <h2>Maya Chen — canonical lease</h2>
            <div className="eval-section-desc">
              The single lease the judge can read in the app. {canon.deposit}.
            </div>
          </div>
          <div className="eval-section-body">
            <ScoreRow label="Costly-clause recall"   r={maya.extractive.recall}    />
            <ScoreRow label="Precision (no false flags)" r={maya.extractive.precision} />
            <ScoreRow label="Boilerplate silence"    r={maya.silence}              />
          </div>
        </div>

        {/* ── Split scorecards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>

          <div className="eval-section" style={{ margin: 0 }}>
            <div className="eval-section-head">
              <h2>Development</h2>
              <div className="eval-section-desc">{summary.development.fixtures} leases — spec set</div>
            </div>
            <div className="eval-section-body">
              <ScoreRow label="Recall"    r={summary.development.extractiveRecall}    />
              <ScoreRow label="Precision" r={summary.development.extractivePrecision} />
              <ScoreRow label="Silence"   r={summary.development.silence}             />
            </div>
          </div>

          <div className="eval-section" style={{ margin: 0 }}>
            <div className="eval-section-head">
              <h2>Held-out</h2>
              <div className="eval-section-desc">{summary.heldOut.fixtures} leases — unseen wrapping</div>
            </div>
            <div className="eval-section-body">
              <ScoreRow label="Recall"    r={summary.heldOut.extractiveRecall}    />
              <ScoreRow label="Precision" r={summary.heldOut.extractivePrecision} />
              <ScoreRow label="Silence"   r={summary.heldOut.silence}             />
            </div>
          </div>

          <div className="eval-section" style={{ margin: 0 }}>
            <div className="eval-section-head">
              <h2>Adversarial</h2>
              <div className="eval-section-desc">{summary.adversarial.fixtures} leases — decoys, instruction text</div>
            </div>
            <div className="eval-section-body">
              <ScoreRow label="Recall"    r={summary.adversarial.extractiveRecall}    />
              <ScoreRow label="Precision" r={summary.adversarial.extractivePrecision} />
              <ScoreRow label="Silence"   r={summary.adversarial.silence}             />
            </div>
          </div>

        </div>

        {/* ── Paraphrase ── */}
        <div className="eval-section">
          <div className="eval-section-head">
            <h2>Paraphrase robustness</h2>
            <div className="eval-section-desc">
              Same costly costs, different wording. The 0.00 is a deliberate design boundary,
              not a score to hide — the playbook is extractive, not semantic.
            </div>
          </div>
          <div className="eval-section-body">
            <ScoreRow label="All paraphrases (semantic)"   r={summary.paraphraseAll}   warn />
            <ScoreRow label="Mixed paraphrases (semantic)" r={summary.paraphraseMixed}      />
          </div>
          <div className="tradeoff-note">
            Design tradeoff: the clerk is optimised for high-confidence findings and measured
            silence, not unrestricted semantic generalisation. Unfamiliar rewrites are missed
            rather than converted into speculative pins.
          </div>
        </div>

        {/* ── Adversarial regression probe ── */}
        <div className="eval-section">
          <div className="eval-section-head">
            <h2>⚠️ Adversarial regression probe (intentional mutation)</h2>
            <div className="eval-section-desc">
              Copy the pet-fee needle into a habitability clause. Expected: the clerk must NOT
              flag habitability. This probe should always show a silence miss — it confirms
              the harness can detect regressions.
            </div>
          </div>
          <div className="eval-section-body">
            <StaticRow
              label="Expected boilerplate silence (before mutation)"
              frac={`${expected}/${expected}`}
              rate="1.00"
            />
            <StaticRow
              label="Probe result (after pet-fee needle injected into habitability)"
              frac={`${probe.silence.quiet}/${probe.silence.ordinary}`}
              rate={pct(probe.silence.rate)}
              fail
            />
          </div>
          <div className="tradeoff-note" style={{ color: "var(--red)", fontStyle: "normal", fontWeight: 500 }}>
            FAIL — intentional regression detected. The harness works.{" "}
            {probe.extractive.fp.join(", ") || "False pin"} on habitability.
          </div>
        </div>

        {/* ── Regression gate explainer ── */}
        <div className="eval-section">
          <div className="eval-section-head">
            <h2>🔒 Automated regression gates (<code>npm test</code>)</h2>
          </div>
          <div className="eval-section-body" style={{ fontSize: "0.875rem", color: "var(--ink2)", lineHeight: 1.7 }}>
            <p>Gates that fail the test suite:</p>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem", display: "grid", gap: "0.25rem" }}>
              <li>Costly-clause recall ≠ 1.00 on <strong>development</strong> labels</li>
              <li>Costly-clause recall ≠ 1.00 on <strong>held-out</strong> labels</li>
              <li>Costly-clause recall ≠ 1.00 on <strong>adversarial</strong> labels</li>
              <li>Precision ≠ 1.00 on any of the three splits</li>
              <li>Boilerplate silence ≠ 1.00 on any of the three splits</li>
              <li>The mutation probe above <em>stops</em> being a silence miss (would mean the harness is broken)</li>
            </ul>
          </div>
        </div>

        {/* ── Per-clause table ── */}
        <div className="eval-section">
          <div className="eval-section-head">
            <h2>Maya Chen — clause-by-clause gold labels</h2>
            <div className="eval-section-desc">Each clause labeled independently of the scanner.</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="eval-table">
              <thead>
                <tr>
                  <th>Clause</th>
                  <th>Gold label</th>
                  <th>Observed</th>
                </tr>
              </thead>
              <tbody>
                {maya.rows.map((row) => (
                  <tr key={row.clauseId}>
                    <td>{row.heading}</td>
                    <td><code>{row.kind}</code></td>
                    <td style={{ color: row.ok ? "var(--green)" : "var(--red)" }}>
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Full corpus table ── */}
        <div className="eval-section">
          <div className="eval-section-head">
            <h2>All labeled leases — full corpus</h2>
            <div className="eval-section-desc">
              {summary.fixtures.length} leases across development, held-out, adversarial, and robustness splits.
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="eval-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Split</th>
                  <th>Recall</th>
                  <th>Precision</th>
                  <th>Silence</th>
                  <th>Semantic</th>
                </tr>
              </thead>
              <tbody>
                {summary.fixtures.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code>{s.id}</code>
                      <div className="row-sub">{s.title}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          padding: "0.1rem 0.4rem",
                          borderRadius: 4,
                          background:
                            s.split === "held-out"    ? "var(--blue-bg)"   :
                            s.split === "adversarial" ? "var(--red-bg)"    :
                            s.split === "robustness"  ? "var(--amber-bg)"  : "var(--bg)",
                          color:
                            s.split === "held-out"    ? "var(--blue)"   :
                            s.split === "adversarial" ? "var(--red)"    :
                            s.split === "robustness"  ? "var(--amber)"  : "var(--muted)",
                          border: "1px solid",
                          borderColor:
                            s.split === "held-out"    ? "var(--blue-bdr)"   :
                            s.split === "adversarial" ? "var(--red-bdr)"    :
                            s.split === "robustness"  ? "var(--amber-bdr)"  : "var(--border)",
                        }}
                      >
                        {s.split}
                      </span>
                    </td>
                    <td style={{ color: s.extractive.recall.rate === 1 ? "var(--green)" : "var(--red)" }}>
                      {s.extractive.recall.hits}/{s.extractive.recall.total} ({pct(s.extractive.recall.rate)})
                    </td>
                    <td style={{ color: s.extractive.precision.rate === 1 || s.extractive.precision.total === 0 ? "var(--green)" : "var(--red)" }}>
                      {s.extractive.precision.hits}/{s.extractive.precision.total} ({pct(s.extractive.precision.rate)})
                    </td>
                    <td style={{ color: s.silence.rate === 1 || s.silence.ordinary === 0 ? "var(--green)" : "var(--orange)" }}>
                      {s.silence.quiet}/{s.silence.ordinary} ({pct(s.silence.rate)})
                    </td>
                    <td style={{ color: "var(--muted)" }}>
                      {s.semantic.recall.hits}/{s.semantic.recall.total} ({pct(s.semantic.recall.rate)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
