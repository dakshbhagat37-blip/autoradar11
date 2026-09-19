import { runDiscovery } from "@/lib/discovery/pipeline";
import { developmentProvider } from "@/lib/discovery/providers/development";
import { DiscoveryProviderError } from "@/lib/discovery/types";
import { SERVICE_TRACKS } from "@/lib/leads/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).optional()
);

const discoveryRequestSchema = z.object({
  text: optionalText,
  industry: optionalText,
  country: optionalText,
  city: optionalText,
  serviceTrack: z.preprocess(
    emptyToUndefined,
    z.enum(SERVICE_TRACKS).optional()
  ),
  limit: z.preprocess(
    emptyToUndefined,
    z.number().int().min(1).max(50).optional()
  ),
});

function errorResponse(status: number, message: string) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON body");
  }

  const parsed = discoveryRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  try {
    const result = await runDiscovery(developmentProvider, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DiscoveryProviderError) {
      return errorResponse(502, "Discovery provider failed");
    }
    return errorResponse(500, "Unexpected application error");
  }
}
