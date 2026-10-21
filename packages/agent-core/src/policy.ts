/**
 * Tool policy gateway: enforces per-run tool scope and the LOCKED approval
 * policy — final external submission / sending requires explicit approval of
 * the exact payload; approval hash invalidation happens at a higher layer.
 */

export interface ToolRequest {
  tool: string;
  allowedTools: string[];
  approvalGrantedForTool?: boolean;
}

export type ToolDecision =
  | { allowed: true }
  | { allowed: false; reason: 'not_in_scope' | 'gated_needs_approval' | 'unknown_tool' };

const KNOWN_AUTO = [
  'search_jobs',
  'save_job',
  'score_job',
  'draft_application',
  'prepare_resume_version',
  'find_contacts',
  'draft_outreach',
];
const KNOWN_GATED = ['submit_application', 'send_outreach'];

export function decideTool(req: ToolRequest): ToolDecision {
  if (!(KNOWN_AUTO.includes(req.tool) || KNOWN_GATED.includes(req.tool))) {
    return { allowed: false, reason: 'unknown_tool' };
  }
  if (!req.allowedTools.includes(req.tool)) {
    return { allowed: false, reason: 'not_in_scope' };
  }
  if (KNOWN_GATED.includes(req.tool) && req.approvalGrantedForTool !== true) {
    return { allowed: false, reason: 'gated_needs_approval' };
  }
  return { allowed: true };
}
