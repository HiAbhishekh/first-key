import type { ClauseSpec, LocatedClause } from "./types";

export function assembleLease(clauses: ClauseSpec[]): {
  text: string;
  clauses: LocatedClause[];
} {
  const text = clauses.map((c) => c.body).join("\n\n");
  return { text, clauses: locateClauses(text, clauses) };
}

export function locateClauses(text: string, specs: ClauseSpec[]): LocatedClause[] {
  let from = 0;
  return specs.map((spec) => {
    const start = text.indexOf(spec.body, from);
    if (start === -1) {
      throw new Error(`Could not locate clause ${spec.id} in lease text`);
    }
    const end = start + spec.body.length;
    from = end;
    return { ...spec, start, end };
  });
}
