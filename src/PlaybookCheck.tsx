import { canonicalSummary, corpus, pct, scoreCanonical, scoreCorpus, scoreProbe } from "./eval/score";
import type { Ratio } from "./eval/types";
import { go } from "./nav";

function Line({
  label,
  r,
  warn,
}: {
  label: string;
  r: Ratio;
  warn?: boolean;
}) {
  return (
    <div className={warn ? "score-row warn" : "score-row"}>
      <span>{label}</span>
      <span className="score-frac">
        {r.hits}/{r.total}
      </span>
      <span className="score-rate">{pct(r.rate)}</span>
    </div>
  );
}

export function PlaybookCheck() {
  const maya = scoreCanonical();
  const summary = scoreCorpus(corpus());
  const canon = canonicalSummary();
  const probe = scoreProbe();
  const probeExpectedOrdinary = probe.silence.ordinary;

  return (
    <div className="desk">
      <header className="top">
        <div>
          <p className="kicker">Clerk playbook evaluation</p>
          <h1>First Key</h1>
          <p className="lede">
            Three questions: did the clerk catch the costly clauses, avoid
            inventing them, and leave ordinary paper alone? This playbook is
            bounded. It is not a general lease parser.
          </p>
        </div>
        <p className="disclaimer">
          <a href="/" onClick={(e) => go("/", e)}>
            Back to the desk
          </a>
        </p>
      </header>

      <section className="paper scorecard">
        <h2>Maya Chen — sample lease</h2>
        <Line label="Costly-clause recall" r={maya.extractive.recall} />
        <Line label="Precision" r={maya.extractive.precision} />
        <Line label="Boilerplate silence" r={maya.silence} />
        <p className="muted tight">{canon.deposit}.</p>
      </section>

      <section className="paper scorecard">
        <h2>Development — spec set</h2>
        <p className="muted">
          Maya Chen plus every exact subset of the four needles. Used to
          specify the playbook. {summary.development.fixtures} leases.
        </p>
        <Line label="Costly-clause recall" r={summary.development.extractiveRecall} />
        <Line label="Precision" r={summary.development.extractivePrecision} />
        <Line label="Boilerplate silence" r={summary.development.silence} />
      </section>

      <section className="paper scorecard">
        <h2>Held-out — unseen wrapping</h2>
        <p className="muted">
          {summary.heldOut.fixtures} leases written after that spec was
          frozen: different landlords, cities, clause order, and extra
          ordinary paper. Same playbook needles when a costly clause is
          present. Not a semantic generalization set.
        </p>
        <Line label="Costly-clause recall" r={summary.heldOut.extractiveRecall} />
        <Line label="Precision" r={summary.heldOut.extractivePrecision} />
        <Line label="Boilerplate silence" r={summary.heldOut.silence} />
      </section>

      <section className="paper scorecard">
        <h2>Adversarial</h2>
        <p className="muted">
          Decoys, instruction-like text in habitability, a two-month
          deposit. {summary.adversarial.fixtures} leases. These are
          production labels, not the mutation probe below.
        </p>
        <Line label="Costly-clause recall" r={summary.adversarial.extractiveRecall} />
        <Line label="Precision" r={summary.adversarial.extractivePrecision} />
        <Line label="Boilerplate silence" r={summary.adversarial.silence} />
      </section>

      <section className="paper scorecard">
        <h2>Paraphrase robustness</h2>
        <p className="muted">
          Same costs, different words. Expected misses. The 0.00 is the
          current boundary, not a score to hide.
        </p>
        <Line label="All paraphrases (semantic)" r={summary.paraphraseAll} warn />
        <Line label="Mixed paraphrases (semantic)" r={summary.paraphraseMixed} />
      </section>

      <section className="paper scorecard probe">
        <h2>Adversarial regression (intentional mutation)</h2>
        <p className="muted">
          Probe: copy the pet-fee needle into habitability. Expected: do
          not flag that ordinary clause. This is not the production silence
          number.
        </p>
        <div className="score-row">
          <span>Expected boilerplate silence</span>
          <span className="score-frac">
            {probeExpectedOrdinary}/{probeExpectedOrdinary}
          </span>
          <span className="score-rate">1.00</span>
        </div>
        <div className="score-row fail">
          <span>Probe result</span>
          <span className="score-frac">
            {probe.silence.quiet}/{probe.silence.ordinary}
          </span>
          <span className="score-rate">{pct(probe.silence.rate)}</span>
        </div>
        <p className="fail-note">
          FAIL — regression detected. {probe.extractive.fp.join(", ") || "false pin"}{" "}
          on habitability.
        </p>
      </section>

      <section className="paper scorecard">
        <h2>Regression gate</h2>
        <p className="muted">
          <code>npm test</code> fails if costly-clause recall, precision, or
          boilerplate silence leave 1.00 on development, held-out, or
          adversarial labels. It also fails if this copied-needle probe
          stops being a silence miss.
        </p>
      </section>

      <p className="tradeoff">
        Design tradeoff: the playbook is optimized for high-confidence
        findings and silence, not unrestricted semantic generalization.
        Unfamiliar paraphrases may be missed rather than converted into
        speculative pins.
      </p>

      <div className="grid">
        <section className="paper">
          <h2>Maya Chen clauses</h2>
          <p className="muted">
            Gold is labeled per clause, independent of the scanner.
          </p>
          <table className="score-table">
            <thead>
              <tr>
                <th>Clause</th>
                <th>Gold</th>
                <th>Observed</th>
              </tr>
            </thead>
            <tbody>
              {maya.rows.map((row) => (
                <tr key={row.clauseId} className={row.ok ? undefined : "bad"}>
                  <td>{row.heading}</td>
                  <td>{row.kind}</td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="paper corpus-table-wrap">
        <h2>Every labeled lease</h2>
        <table className="score-table">
          <thead>
            <tr>
              <th>Lease</th>
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
                  <div className="muted tight">{s.title}</div>
                </td>
                <td>{s.split}</td>
                <td>
                  {s.extractive.recall.hits}/{s.extractive.recall.total} (
                  {pct(s.extractive.recall.rate)})
                </td>
                <td>
                  {s.extractive.precision.hits}/{s.extractive.precision.total}{" "}
                  ({pct(s.extractive.precision.rate)})
                </td>
                <td>
                  {s.silence.quiet}/{s.silence.ordinary} ({pct(s.silence.rate)})
                </td>
                <td>
                  {s.semantic.recall.hits}/{s.semantic.recall.total} (
                  {pct(s.semantic.recall.rate)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
