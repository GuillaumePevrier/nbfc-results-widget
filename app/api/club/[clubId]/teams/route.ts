import { NextResponse } from "next/server";
import { getClubTeams } from "@/lib/dofa";

export async function GET(
  _request: Request,
  { params }: { params: { clubId: string } }
) {
  const { clubId } = params;
  const teams = await getClubTeams(clubId);
  return NextResponse.json(teams, { status: 200 });
}
