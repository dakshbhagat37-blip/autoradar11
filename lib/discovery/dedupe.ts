import { normalizeWebsite } from "@/lib/leads/normalize";
import type { Lead } from "@/lib/leads/types";

function compactText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function comparisonName(name: string): string {
  return compactText(name);
}

function comparisonCity(city: string | null | undefined): string | null {
  if (!city) return null;
  const normalized = compactText(city);
  return normalized === "" ? null : normalized;
}

function comparisonDomain(website: string | null | undefined): string | null {
  const normalized = normalizeWebsite(website);
  if (!normalized) return null;

  try {
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(normalized);
    const url = new URL(hasScheme ? normalized : `https://${normalized}`);
    const host = url.hostname.toLowerCase();
    return host === "" ? null : host;
  } catch {
    const fallback = compactText(normalized);
    return fallback === "" ? null : fallback;
  }
}

/**
 * Conservative company dedupe. Same domain always merges.
 * Same name + city merges. Same name with no location on either side merges.
 * Similar-but-different names are never merged.
 */
export function dedupeLeads(leads: Lead[]): Lead[] {
  const seenDomains = new Set<string>();
  const seenNameCity = new Set<string>();
  const seenNameWithoutLocation = new Set<string>();
  const unique: Lead[] = [];

  for (const lead of leads) {
    const domain = comparisonDomain(lead.website);
    if (domain && seenDomains.has(domain)) {
      continue;
    }

    const name = comparisonName(lead.companyName);
    const city = comparisonCity(lead.city);

    if (city) {
      const nameCityKey = `${name}|${city}`;
      if (seenNameCity.has(nameCityKey)) {
        continue;
      }
      seenNameCity.add(nameCityKey);
    } else {
      if (seenNameWithoutLocation.has(name)) {
        continue;
      }
      seenNameWithoutLocation.add(name);
    }

    if (domain) {
      seenDomains.add(domain);
    }

    unique.push(lead);
  }

  return unique;
}
