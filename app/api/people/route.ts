import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPublicDataset } from "@/lib/server/dataset";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const dataset = await getPublicDataset();
    const body = JSON.stringify(dataset);
    const etag = `"${createHash("sha256").update(body).digest("base64url").slice(0, 24)}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "private, no-cache" } });
    }
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "private, no-cache",
        ETag: etag
      }
    });
  } catch {
    return NextResponse.json({ error: "Directory data is temporarily unavailable." }, { status: 503 });
  }
}
