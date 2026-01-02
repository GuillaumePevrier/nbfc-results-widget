import { NextResponse } from "next/server";
import { getClubResults } from "@/lib/dofa";

export async function GET(
  _request: Request,
  { params }: { params: { clubId: string } }
) {
  const clubId = params.clubId;
  const results = await getClubResults(clubId);
  return NextResponse.json(results, { status: 200 });
}
