import { NextResponse } from "next/server";
import { DEFAULT_CLUB_ID, extractClubNumber, mapTeamsResponse, selectDefaultTeam } from "@/lib/dofa";

const buildInternalUrl = (request: Request, path: string) => new URL(path, request.url).toString();

const fetchProxy = (request: Request, path: string) =>
  fetch(buildInternalUrl(request, path), { next: { revalidate: 0 } });

const resolveClubId = async (request: Request, providedId: string): Promise<string> => {
  const candidate = providedId || DEFAULT_CLUB_ID;
  const infoResponse = await fetchProxy(request, `/api/dofa/club/${candidate}`);

  if (infoResponse.ok) {
    try {
      const data = await infoResponse.json();
      const resolved = extractClubNumber(data);
      if (resolved) return resolved;
    } catch (error) {
      console.error("Unable to parse club info", error);
    }
  }

  return candidate;
};

export async function GET(request: Request, { params }: { params: { clubId: string } }) {
  const providedClubId = params.clubId || DEFAULT_CLUB_ID;

  try {
    const clubId = await resolveClubId(request, providedClubId);
    const response = await fetchProxy(request, `/api/dofa/club/${clubId}/equipes`);
    if (!response.ok) {
      const errorPayload = {
        error: true,
        status: response.status,
        message: "Erreur lors de la récupération des équipes",
      };
      return NextResponse.json(errorPayload, { status: response.status });
    }

    const data = await response.json();
    const teams = mapTeamsResponse(data);
    const defaultTeam = selectDefaultTeam(teams);

    return NextResponse.json({ teams, defaultTeam }, { status: 200 });
  } catch (error) {
    const message = (error as Error)?.message ?? "Erreur lors de la récupération des équipes";
    return NextResponse.json({ error: true, status: 500, message }, { status: 500 });
  }
}
