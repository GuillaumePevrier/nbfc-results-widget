import { NextResponse } from "next/server";
import {
  DEFAULT_CLUB_ID,
  buildResultsPayload,
  fetchClubResults,
  fetchCompetitionRanking,
} from "@/lib/dofa";
import { ClubResultsPayload, ErrorPayload } from "@/types/results";

export async function GET(request: Request, { params }: { params: { clubId: string } }) {
  const clubId = params.clubId || DEFAULT_CLUB_ID;
  const { searchParams } = new URL(request.url);
  const competitionId = searchParams.get("competitionId") || undefined;

  try {
    const matches = await fetchClubResults(clubId, competitionId);
    const ranking = await fetchCompetitionRanking(competitionId);

    if (!matches.lastMatch && !matches.nextMatch) {
      const status = 502;
      const errorPayload: ErrorPayload = {
        error: true,
        status,
        message: "Aucun match exploitable retourné par la DOFA",
      };
      return NextResponse.json(errorPayload, { status });
    }

    const payload: ClubResultsPayload = buildResultsPayload(clubId, matches, ranking);

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 502;
    const message =
      (error as Error)?.message ?? "Erreur lors de la récupération des données DOFA";
    const errorPayload: ErrorPayload = { error: true, status, message };

    return NextResponse.json(errorPayload, { status });
  }
}
