import type { SearchProfile, Assessment } from '@pursuit/discovery';
import type { Form, Receipt } from '@pursuit/application';
export type { SearchProfile, Assessment, Form };
export type SearchMatch = {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  observedAt: string;
  status: string;
  assessment: Assessment;
};
export type SourcedOpportunity = {
  id: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  posting: string;
  reason: string;
  status: 'Review';
  discovery: { jobId: string; url: string; observedAt: string; assessment: Assessment };
};
export type ExecutionPlan = {
  id: string;
  state: string;
  payload_hash: string;
  last_error: string | null;
  payload: {
    jobUrl: string;
    packetHash: string;
    pdfHash: string;
    answers: Record<string, string | boolean>;
    formHash: string;
  };
  receipt: Receipt | null;
  approval_until: string | null;
};
export type ExecutionSummary = Omit<ExecutionPlan, 'payload'> & { jobUrl: string };
export type EngineSnapshot = {
  profile: SearchProfile;
  sources: {
    id: string;
    company: string;
    provider: string;
    enabled: boolean;
    lastSuccess: string | null;
    lastError: string | null;
  }[];
  matches: SearchMatch[];
  runs: {
    source_id: string;
    status: string;
    count: number;
    started_at: string;
    diagnostics: string[];
  }[];
  policy: { enabled: boolean; dailyLimit: number };
  plans: ExecutionSummary[];
};
export type EngineProgress = { phase: string; message: string; completed?: number; total?: number };
export type EngineRequest = { action: string; [key: string]: unknown };
export type EngineClient = (
  request: EngineRequest,
  progress?: (event: EngineProgress) => void,
) => Promise<any>;
