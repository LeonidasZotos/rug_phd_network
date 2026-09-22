import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  try {
    getDatabase().prepare("SELECT 1").get();
    return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
