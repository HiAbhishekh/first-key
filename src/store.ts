import { useCallback, useEffect, useMemo, useState, type Dispatch } from "react";
import { bothAgreed } from "./catalog";
import { TENANT, UNIT } from "./gold";
import { buildIcs, buildLetter } from "./letter";
import { scanLease } from "./playbook";
import type {
  Application,
  Finding,
  Packet,
  Seat,
  Stage,
} from "./types";

const STORAGE_KEY = "first-key-packet-v1";
const CHANNEL = "first-key";
const TAB_KEY = "first-key-tab-id";

export type Action =
  | { type: "hydrate"; packet: Packet }
  | { type: "reset" }
  | { type: "set-stage"; stage: Stage }
  | { type: "pull-listing" }
  | { type: "run-playbook" }
  | {
      type: "pin-finding";
      title: string;
      detail: string;
      quote: string;
      costNote: string;
      author: "clerk" | "you";
    }
  | { type: "set-finding-status"; id: string; status: Finding["status"] }
  | { type: "fill-application"; field: keyof Application; value: string }
  | { type: "stage-outbound" }
  | { type: "clear-outbound" }
  | { type: "countersign" }
  | { type: "human-submit" }
  | { type: "agree"; seat: Seat; tabId: string };

export function emptyPacket(): Packet {
  return {
    stage: "listing",
    tenant: TENANT,
    listingPulled: false,
    findings: [],
    application: {
      fullName: "",
      email: "",
      phone: "",
      unit: UNIT,
      moveIn: "2026-09-01",
      monthlyIncome: "",
      hasPet: "no",
      humanSubmitted: false,
    },
    outbound: null,
    countersigned: false,
    agreedPrincipal: false,
    agreedParent: false,
    agreedPrincipalTab: null,
    agreedParentTab: null,
  };
}

function clearAgreements(packet: Packet): Packet {
  return {
    ...packet,
    agreedPrincipal: false,
    agreedParent: false,
    agreedPrincipalTab: null,
    agreedParentTab: null,
  };
}

export function packetsEqual(a: Packet, b: Packet): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function uid(): string {
  return `f-${Math.random().toString(36).slice(2, 10)}`;
}

export function reduce(packet: Packet, action: Action): Packet {
  switch (action.type) {
    case "hydrate":
      return action.packet;
    case "reset":
      return emptyPacket();
    case "set-stage":
      return { ...packet, stage: action.stage };
    case "pull-listing":
      return { ...packet, listingPulled: true, stage: "lease" };
    case "run-playbook": {
      const dismissed = new Set(
        packet.findings.filter((f) => f.status === "dismissed").map((f) => f.ruleId),
      );
      const present = new Set(
        packet.findings
          .filter((f) => f.status !== "dismissed")
          .map((f) => f.ruleId),
      );
      const next = [...packet.findings];
      for (const hit of scanLease()) {
        if (dismissed.has(hit.ruleId) || present.has(hit.ruleId)) continue;
        next.push({
          id: uid(),
          ruleId: hit.ruleId,
          title: hit.title,
          detail: hit.detail,
          quote: hit.quote,
          costNote: hit.costNote,
          status: "open",
          author: "clerk",
        });
      }
      return { ...packet, findings: next };
    }
    case "pin-finding":
      return {
        ...packet,
        findings: [
          ...packet.findings,
          {
            id: uid(),
            ruleId: `pin-${uid()}`,
            title: action.title,
            detail: action.detail,
            quote: action.quote,
            costNote: action.costNote,
            status: "open",
            author: action.author,
          },
        ],
      };
    case "set-finding-status":
      return clearAgreements({
        ...packet,
        findings: packet.findings.map((f) =>
          f.id === action.id ? { ...f, status: action.status } : f,
        ),
      });
    case "fill-application":
      if (action.field === "humanSubmitted") return packet;
      return {
        ...packet,
        application: { ...packet.application, [action.field]: action.value },
      };
    case "stage-outbound": {
      const accepted = packet.findings.filter((f) => f.status === "accepted");
      return clearAgreements({
        ...packet,
        outbound: {
          letter: buildLetter(accepted),
          ics: buildIcs(),
          noticeDate: "2 July 2027",
        },
        stage: "outbound",
      });
    }
    case "clear-outbound":
      return clearAgreements({
        ...packet,
        outbound: null,
        countersigned: false,
      });
    case "agree": {
      if (!packet.outbound || !action.tabId) return packet;
      const otherTab =
        action.seat === "principal"
          ? packet.agreedParentTab
          : packet.agreedPrincipalTab;
      if (otherTab && otherTab === action.tabId) {
        return packet;
      }
      if (action.seat === "principal") {
        return {
          ...packet,
          agreedPrincipal: true,
          agreedPrincipalTab: action.tabId,
        };
      }
      return {
        ...packet,
        agreedParent: true,
        agreedParentTab: action.tabId,
      };
    }
    case "countersign":
      if (!packet.outbound || !bothAgreed(packet)) {
        return packet;
      }
      return { ...packet, countersigned: true };
    case "human-submit":
      return {
        ...packet,
        application: { ...packet.application, humanSubmitted: true },
      };
    default:
      return packet;
  }
}

function readSeat(): Seat {
  const q = new URLSearchParams(window.location.search).get("seat");
  return q === "parent" ? "parent" : "principal";
}

export function readTabId(): string {
  let id = sessionStorage.getItem(TAB_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(TAB_KEY, id);
  }
  return id;
}

function hydratePacket(parsed: Packet): Packet {
  return {
    ...emptyPacket(),
    ...parsed,
    agreedPrincipal: Boolean(parsed.agreedPrincipal),
    agreedParent: Boolean(parsed.agreedParent),
    agreedPrincipalTab: parsed.agreedPrincipalTab ?? null,
    agreedParentTab: parsed.agreedParentTab ?? null,
    application: {
      ...emptyPacket().application,
      ...parsed.application,
    },
  };
}

export function usePacket(): {
  packet: Packet;
  dispatch: Dispatch<Action>;
  seat: Seat;
  tabId: string;
  highlightId: string | null;
  setHighlightId: (id: string | null) => void;
} {
  const [packet, setPacket] = useState<Packet>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return hydratePacket(JSON.parse(raw) as Packet);
    } catch {
      /* empty packet */
    }
    return emptyPacket();
  });
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const seat = useMemo(readSeat, []);
  const tabId = useMemo(readTabId, []);

  const dispatch = useCallback((action: Action) => {
    setPacket((prev) => {
      const next = reduce(prev, action);
      return packetsEqual(prev, next) ? prev : next;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packet));
    const ch = new BroadcastChannel(CHANNEL);
    ch.postMessage(packet);
    ch.close();
  }, [packet]);

  useEffect(() => {
    const applyRemote = (incoming: Packet) => {
      if (!incoming?.tenant) return;
      const next = hydratePacket(incoming);
      setPacket((prev) => (packetsEqual(prev, next) ? prev : next));
    };
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (ev: MessageEvent<Packet>) => applyRemote(ev.data);
    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== STORAGE_KEY || !ev.newValue) return;
      try {
        applyRemote(JSON.parse(ev.newValue) as Packet);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      ch.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { packet, dispatch, seat, tabId, highlightId, setHighlightId };
}
