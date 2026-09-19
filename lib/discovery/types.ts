import type { Lead, LeadInput, ServiceTrack } from "@/lib/leads/types";

export type DiscoveryRequest = {
  text?: string;
  industry?: string;
  country?: string;
  city?: string;
  serviceTrack?: ServiceTrack;
  limit?: number;
};

export type DiscoveryCandidate = LeadInput;

export type DiscoveryResponse = {
  success: boolean;
  provider: string;
  discovered: number;
  leads: Lead[];
  nextCursor?: string | null;
};

export class DiscoveryProviderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DiscoveryProviderError";
  }
}
