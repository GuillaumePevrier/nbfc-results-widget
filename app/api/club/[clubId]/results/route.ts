import { NextResponse } from "next/server";
import {
  DEFAULT_CLUB_ID,
  buildResultsPayload,
  extractClubNumber,
  fetchCompetitionRanking,
  parseMatches,
} from "@/lib/dofa";
import { ClubResultsPayload, ErrorPayload } from "@/types/results";

const buildInternalUrl = (request: Request, path: string) => new URL(path, request.url).toString();

const fetchProxy = (request: Request, path: string) =>
  fetch(buildInternalUrl(request, path), { next: { revalidate: 0 } });

const lookupClubNumber = async (request: Request, clubId: string): Promise<string | null> => {
  const infoResponse = await fetchProxy(request, `/api/dofa/club/${clubId}`);
  if (!infoResponse.ok) return null;

  try {
    const data = await infoResponse.json();
    return extractClubNumber(data);
  } catch (error) {
    console.error("Failed to parse club info", error);
    return null;
  }
};

const resolveClubId = async (request: Request, providedId: string): Promise<string> => {
  const candidate = providedId || DEFAULT_CLUB_ID;

  if (/^\d{6,}$/.test(candidate) && candidate !== DEFAULT_CLUB_ID) {
    const resolved = await lookupClubNumber(request, candidate);
    if (resolved) return resolved;
  }

  return candidate;
};

export async function GET(request: Request, { params }: { params: { clubId: string } }) {
  const providedClubId = params.clubId || DEFAULT_CLUB_ID;
  const { searchParams } = new URL(request.url);
  const competitionId = searchParams.get("competitionId") || undefined;

  try {
    let clubId = await resolveClubId(request, providedClubId);

    let resultsResponse = await fetchProxy(request, `/api/dofa/club/${clubId}/resultat`);

    if (resultsResponse.status === 404) {
      const fallbackId = await lookupClubNumber(request, providedClubId);
      if (fallbackId && fallbackId !== clubId) {
        clubId = fallbackId;
        resultsResponse = await fetchProxy(request, `/api/dofa/club/${clubId}/resultat`);
      } else {
        const errorPayload: ErrorPayload = {
          error: true,
          status: 404,
          message: "Identifiant club invalide",
        };
        return NextResponse.json(errorPayload, { status: 404 });
      }
    }

    if (!resultsResponse.ok) {
      let detail: string | undefined;
      try {
        const body = await resultsResponse.json();
        detail = (body as { detail?: string })?.detail;
      } catch (error) {
        detail = (error as Error)?.message;
      }

      const errorPayload: ErrorPayload = {
        error: true,
        status: resultsResponse.status,
        message: detail || "Erreur lors de la récupération des résultats",
        detail,
      };

      return NextResponse.json(errorPayload, { status: resultsResponse.status });
    }

    const resultsData = await resultsResponse.json();

    const calendarResponse = await fetchProxy(request, `/api/dofa/club/${clubId}/calendrier`);
    const calendarData = calendarResponse.ok ? await calendarResponse.json() : undefined;

    const matches = parseMatches(resultsData, calendarData, competitionId ?? undefined);

    const ranking = await fetchCompetitionRanking(competitionId);

    const note = !matches.lastMatch && !matches.nextMatch ? "Aucun match disponible" : undefined;

    const payload: ClubResultsPayload = buildResultsPayload(clubId, matches, ranking, note);

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const message = (error as Error)?.message ?? "Erreur inattendue";
    const errorPayload: ErrorPayload = { error: true, status: 500, message };
    return NextResponse.json(errorPayload, { status: 500 });
  }
}
