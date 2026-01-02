import { NextResponse } from "next/server";
import { getClubTeams, DEFAULT_CLUB_ID } from "@/lib/dofa";

export async function GET(
  _request: Request,
  { params }: { params: { clubId: string } }
) {
  const clubId = params.clubId || DEFAULT_CLUB_ID;

  try {
    const teams = await getClubTeams(clubId);
    return NextResponse.json(teams, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 502;
    const message =
      (error as Error)?.message ?? "Erreur lors de la récupération des équipes";
    return NextResponse.json({ error: true, status, message }, { status });
  }
}
