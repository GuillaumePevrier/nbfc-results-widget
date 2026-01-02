import { NextResponse } from "next/server";
import { DEFAULT_CLUB_ID, getClubResults } from "@/lib/dofa";

export async function GET(
  _request: Request,
  { params }: { params: { clubId: string } }
) {
  const clubId = params.clubId || DEFAULT_CLUB_ID;
  const results = await getClubResults(clubId);
  return NextResponse.json(results, { status: 200 });
}
