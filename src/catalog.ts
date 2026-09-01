import type { Packet, Stage } from "./types";

/** Never passed to document.modelContext.registerTool. */
export const WITHHELD_TOOLS = [
  "send",
  "send_email",
  "submit_application",
  "write_calendar",
  "pay",
  "agree",
  "countersign",
] as const;

export type ToolName =
  | "get_packet_state"
  | "lookup_playbook"
  | "pull_listing_terms"
  | "list_findings"
  | "read_span"
  | "run_playbook"
  | "pin_finding"
  | "set_finding_status"
  | "jump_to_span"
  | "get_application"
  | "fill_application_field"
  | "stage_outbound"
  | "clear_outbound";

export function hasAccepted(packet: Packet): boolean {
  return packet.findings.some((f) => f.status === "accepted");
}

export function bothAgreed(packet: Packet): boolean {
  return (
    packet.agreedPrincipal &&
    packet.agreedParent &&
    Boolean(packet.agreedPrincipalTab) &&
    Boolean(packet.agreedParentTab) &&
    packet.agreedPrincipalTab !== packet.agreedParentTab
  );
}

/** Single source of truth for Proof 3. Site tools and the roster both use this. */
export function toolsOnStage(packet: Packet): ToolName[] {
  const stage: Stage = packet.stage;
  const on: ToolName[] = ["get_packet_state", "lookup_playbook"];

  if (stage === "listing") on.push("pull_listing_terms");

  if (stage === "lease") {
    on.push(
      "list_findings",
      "read_span",
      "run_playbook",
      "pin_finding",
      "set_finding_status",
      "jump_to_span",
    );
    if (hasAccepted(packet)) on.push("stage_outbound");
  }

  if (stage === "application") {
    on.push("get_application", "fill_application_field");
  }

  if (stage === "outbound") {
    on.push("list_findings", "set_finding_status");
    if (hasAccepted(packet)) on.push("stage_outbound");
    if (packet.outbound) on.push("clear_outbound");
  }

  return on;
}

export function toolIsOn(packet: Packet, name: ToolName): boolean {
  return toolsOnStage(packet).includes(name);
}
