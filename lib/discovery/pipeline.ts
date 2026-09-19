import { normalizeLead } from "@/lib/leads/normalize";
import type { Lead, LeadInput } from "@/lib/leads/types";
import type { DiscoveryProvider, DiscoveryQuery } from "@/lib/providers/types";
import { dedupeLeads } from "./dedupe";
import {
  DiscoveryProviderError,
  type DiscoveryCandidate,
  type DiscoveryResponse,
} from "./types";

const LEAD_INPUT_KEYS = [
  "companyName",
  "website",
  "industry",
  "country",
  "city",
  "employeeRange",
  "serviceTrack",
  "source",
  "sourceUrl",
  "description",
  "linkedinUrl",
  "instagramUrl",
  "facebookUrl",
  "foundedYear",
] as const satisfies readonly (keyof LeadInput)[];

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function clampLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_LIMIT;
  if (!Number.isInteger(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(limit, 1), MAX_LIMIT);
}

function toLeadInput(raw: Record<string, unknown>): DiscoveryCandidate {
  const input: LeadInput = {};

  for (const key of LEAD_INPUT_KEYS) {
    if (key in raw) {
      input[key] = raw[key];
    }
  }

  return input;
}

function tryNormalize(candidate: DiscoveryCandidate): Lead | null {
  try {
    return normalizeLead(candidate);
  } catch {
    return null;
  }
}

export async function runDiscovery(
  provider: DiscoveryProvider,
  query: DiscoveryQuery
): Promise<DiscoveryResponse> {
  const limit = clampLimit(query.limit);

  let raw: Awaited<ReturnType<DiscoveryProvider["discover"]>>;
  try {
    raw = await provider.discover({ ...query, limit });
  } catch (cause) {
    throw new DiscoveryProviderError("Discovery provider failed", { cause });
  }

  const leads: Lead[] = [];
  for (const candidate of raw.candidates) {
    const input = toLeadInput(candidate);
    const normalized = tryNormalize(input);
    if (normalized) {
      leads.push(normalized);
    }
  }

  const unique = dedupeLeads(leads).slice(0, limit);

  return {
    success: true,
    provider: provider.id,
    discovered: unique.length,
    leads: unique,
    nextCursor: raw.nextCursor ?? null,
  };
}
