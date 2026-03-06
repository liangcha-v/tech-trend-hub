import { NextResponse } from "next/server";
import { syncAllSources } from "@/lib/scrapers";

export async function GET() {
  const results = await syncAllSources();
  return NextResponse.json({
    message: "同步流程已结束",
    results
  });
}