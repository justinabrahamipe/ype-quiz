import { NextResponse } from "next/server";

// "Missed" counts are now derived live from quiz/attempt tables (see
// lib/aggregate-score.ts), so this cron is a no-op. Kept as a stable endpoint
// in case the schedule still fires.
export async function GET() {
  return NextResponse.json({ processed: 0, deprecated: true });
}
