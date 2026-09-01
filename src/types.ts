export type Stage = "listing" | "lease" | "application" | "outbound";

export type FindingStatus = "open" | "accepted" | "dismissed";

export type Author = "clerk" | "you";

export type Seat = "principal" | "parent";

export type Finding = {
  id: string;
  ruleId: string;
  title: string;
  detail: string;
  quote: string;
  costNote: string;
  status: FindingStatus;
  author: Author;
};

export type Application = {
  fullName: string;
  email: string;
  phone: string;
  unit: string;
  moveIn: string;
  monthlyIncome: string;
  hasPet: string;
  humanSubmitted: boolean;
};

export type Outbound = {
  letter: string;
  ics: string;
  noticeDate: string;
};

export type Packet = {
  stage: Stage;
  tenant: string;
  listingPulled: boolean;
  findings: Finding[];
  application: Application;
  outbound: Outbound | null;
  countersigned: boolean;
  agreedPrincipal: boolean;
  agreedParent: boolean;
  /** Browsing-context id that agreed as Maya. Distinct from agreedParentTab. */
  agreedPrincipalTab: string | null;
  /** Browsing-context id that agreed as parent. Distinct from agreedPrincipalTab. */
  agreedParentTab: string | null;
};

export type ScanHit = {
  ruleId: string;
  title: string;
  detail: string;
  quote: string;
  costNote: string;
};
