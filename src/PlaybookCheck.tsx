import { canonicalSummary, corpus, pct, scoreCanonical, scoreCorpus } from "./eval/score";
import { go } from "./nav";

export function PlaybookCheck() {
  const maya = scoreCanonical();
  const summary = scoreCorpus(corpus());
  const canon = canonicalSummary();

  return (
    <div className="desk">
      <header className="top">
        <div>
          <p className="kicker">Playbook check</p>
          <h1>What the clerk pins</h1>
          <p className="lede">
            Four costly clauses on the Maya Chen sample lease. Ordinary terms
            stay off the list, including the security deposit. This playbook
            matches exact wording, not a paraphrase of the same cost.
          </p>
        </div>
        <p className="disclaimer">
          <a href="/" onClick={(e) => go("/", e)}>
            Back to the desk
          </a>
        </p>
      </header>

      <div className="stats" aria-label="Maya Chen sample scores">
        <div className="stat">
          <span className="stat-n">{pct(maya.extractive.recall.rate)}</span>
          <span className="stat-l">
            Costly-clause recall {canon.costlyRecallN}
          </span>
        </div>
        <div className="stat">
          <span className="stat-n">{pct(maya.extractive.precision.rate)}</span>
          <span className="stat-l">Precision {canon.precisionN}</span>
        </div>
        <div className="stat">
          <span className="stat-n">{pct(maya.silence.rate)}</span>
          <span className="stat-l">
            Silence on ordinary clauses {canon.silenceN}
          </span>
        </div>
      </div>

      <p className="muted gap-note">{canon.deposit}.</p>

      <div className="grid">
        <section className="paper">
          <h2>Maya Chen clauses</h2>
          <p className="muted">
            Gold is labeled per clause, independent of the scanner. A miss or
            a pin on boilerplate would show here.
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

        <section className="side">
          <div className="card">
            <h2>Labeled corpus</h2>
            <p className="muted">
              {summary.fixtureCount} leases: exact subsets of the four
              needles, decoys, injection in habitability, a two-month
              deposit, and paraphrases.
            </p>
            <dl className="meta corpus-meta">
              <div>
                <dt>Extractive recall</dt>
                <dd>
                  {summary.extractive.extractiveRecall.hits}/
                  {summary.extractive.extractiveRecall.total} (
                  {pct(summary.extractive.extractiveRecall.rate)})
                </dd>
              </div>
              <div>
                <dt>Extractive precision</dt>
                <dd>
                  {summary.extractive.extractivePrecision.hits}/
                  {summary.extractive.extractivePrecision.total} (
                  {pct(summary.extractive.extractivePrecision.rate)})
                </dd>
              </div>
              <div>
                <dt>Silence</dt>
                <dd>
                  {summary.extractive.silence.hits}/
                  {summary.extractive.silence.total} (
                  {pct(summary.extractive.silence.rate)})
                </dd>
              </div>
            </dl>
            <p className="muted">
              Paraphrase-all semantic recall {pct(summary.paraphraseAll.rate)} (
              {summary.paraphraseAll.hits}/{summary.paraphraseAll.total}):
              restated costs, no needles. Mixed paraphrases{" "}
              {pct(summary.paraphraseMixed.rate)} (
              {summary.paraphraseMixed.hits}/{summary.paraphraseMixed.total}):
              exact needles still pin; the restated rule is a miss.
            </p>
          </div>
        </section>
      </div>

      <section className="paper corpus-table-wrap">
        <h2>Every labeled lease</h2>
        <table className="score-table">
          <thead>
            <tr>
              <th>Lease</th>
              <th>Cohort</th>
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
                <td>{s.cohort}</td>
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
