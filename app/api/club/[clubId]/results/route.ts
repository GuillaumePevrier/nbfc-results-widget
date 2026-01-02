import { NextResponse } from "next/server";
import { DEFAULT_CLUB_ID, fetchClubResults } from "@/lib/dofa";
import { ClubResultsPayload, ErrorPayload } from "@/types/results";

export async function GET(
  _request: Request,
  { params }: { params: { clubId: string } }
) {
  const clubId = params.clubId || DEFAULT_CLUB_ID;

  try {
    const { lastMatch, nextMatch } = await fetchClubResults(clubId);

    if (!lastMatch && !nextMatch) {
      const status = 502;
      const errorPayload: ErrorPayload = {
        error: true,
        status,
        message: "Aucun match exploitable retourné par la DOFA",
      };
      return NextResponse.json(errorPayload, { status });
    }

    const payload: ClubResultsPayload = {
      clubId,
      lastMatch,
      nextMatch,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 502;
    const message =
      (error as Error)?.message ?? "Erreur lors de la récupération des données DOFA";
    const errorPayload: ErrorPayload = { error: true, status, message };

    return NextResponse.json(errorPayload, { status });
  }
}
