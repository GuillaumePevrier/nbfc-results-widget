import { headers } from "next/headers";
import { Widget } from "@/components/Widget";
import { ClubResultsPayload, ErrorPayload, isErrorPayload } from "@/types/results";
import { ClubTeam } from "@/types/teams";
import { DEFAULT_CLUB_ID, buildResultsPayload, extractClubNumber, parseMatches } from "@/lib/dofa";

interface WidgetPageProps {
  searchParams?: {
    club?: string;
    teamKey?: string;
    team?: string;
    cpNo?: string;
  };
}

export const revalidate = 0;

const buildInternalUrl = (path: string) => {
  const incomingHeaders = headers();
  const host = incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host");
  const protocol = incomingHeaders.get("x-forwarded-proto") ?? "https";
  if (!host) throw new Error("Host header missing");
  return `${protocol}://${host}${path}`;
};

const fetchInternal = async (path: string) => {
  const url = buildInternalUrl(path);
  const response = await fetch(url, { cache: "no-store" });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;
  return { response, data } as { response: Response; data: any };
};

const parseClubName = (data: unknown): string | null => {
  if (!data || typeof data !== "object") return null;
  const entry = data as Record<string, unknown>;
  return (
    (entry["nom"] as string) ||
    (entry["nomClub"] as string) ||
    (entry["club"] as string) ||
    (entry["name"] as string) ||
    null
  );
};

const resolveClubId = async (clubParam?: string) => {
  const candidate = clubParam?.trim() || DEFAULT_CLUB_ID;

  const infoResponse = await fetchInternal(`/api/dofa/club/${candidate}`);
  if (infoResponse.response.ok && !isErrorPayload(infoResponse.data)) {
    const clubNumber = extractClubNumber(infoResponse.data);
    const clubName = parseClubName(infoResponse.data);
    return { clubId: clubNumber || candidate, clubName: clubName || `Club ${candidate}` };
  }

  return { clubId: candidate, clubName: `Club ${candidate}` };
};

const buildErrorState = (payload: ErrorPayload | null, fallback: string) => {
  return (
    <main style={{ padding: "16px" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          color: "#0f172a",
        }}
      >
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>Données indisponibles</h2>
        <p style={{ color: "#6b7280", margin: 0 }}>{fallback}</p>
        {payload ? (
          <p style={{ color: "#9ca3af", marginTop: 8, fontSize: "0.85rem" }}>
            Statut HTTP: {payload.status}
            {payload.message ? ` • ${payload.message}` : ""}
          </p>
        ) : null}
      </div>
    </main>
  );
};

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const clubParam = searchParams?.club?.trim();
  const teamKeyParam = searchParams?.teamKey?.trim() || searchParams?.team?.trim();
  const cpNoParam = searchParams?.cpNo?.trim();

  const { clubId: initialClubId, clubName: initialClubName } = await resolveClubId(clubParam);

  let clubId = initialClubId;
  let clubName = initialClubName;

  const teamsResult = await fetchInternal(`/api/dofa/teams?clNo=${encodeURIComponent(clubId)}`);

  let teams: ClubTeam[] = [];
  if (teamsResult.response.ok && teamsResult.data?.ok) {
    teams = (teamsResult.data.teams as ClubTeam[]) || [];
  }

  const selectedTeam = teams.find((team) => team.key === teamKeyParam) || teams[0] || null;
  const selectedCompetitionId = cpNoParam || selectedTeam?.competitions?.[0]?.cp_no;

  const resultsQuery = selectedCompetitionId
    ? `&cpNo=${encodeURIComponent(selectedCompetitionId)}`
    : "";
  let resultsPath = `/api/dofa/results?clNo=${encodeURIComponent(clubId)}${resultsQuery}`;
  let resultsResponse = await fetchInternal(resultsPath);

  // If a competition filter yields no route (404), retry without the filter before surfacing an error
  if (!resultsResponse.response.ok && selectedCompetitionId) {
    const fallbackPath = `/api/dofa/results?clNo=${encodeURIComponent(clubId)}`;
    const fallbackResponse = await fetchInternal(fallbackPath);
    if (fallbackResponse.response.ok && fallbackResponse.data?.ok) {
      resultsResponse = fallbackResponse;
    }
  }

  if (resultsResponse.response.status === 404 && clubParam && clubParam !== clubId) {
    const resolved = await resolveClubId(clubParam);
    clubId = resolved.clubId;
    clubName = resolved.clubName;
    resultsPath = `/api/dofa/results?clNo=${encodeURIComponent(clubId)}${resultsQuery}`;
    resultsResponse = await fetchInternal(resultsPath);
  }

  if (!resultsResponse.response.ok || !resultsResponse.data?.ok) {
    const status = resultsResponse.response.status;
    const message =
      status === 404
        ? "Identifiant club invalide"
        : resultsResponse.data?.message || "Erreur lors du chargement des résultats";
    const errorPayload: ErrorPayload = { error: true, status, message };
    return buildErrorState(errorPayload, "Impossible de récupérer les résultats du club.");
  }

  const resultsData = resultsResponse.data?.data;
  const calendarResponse = await fetchInternal(`/api/dofa/club/${clubId}/calendrier`);
  const calendarData = calendarResponse.response.ok ? calendarResponse.data : undefined;

  const matches = parseMatches(resultsData, calendarData, selectedCompetitionId || undefined);
  const note = !matches.lastMatch && !matches.nextMatch ? "Aucun match disponible" : undefined;
  const payload: ClubResultsPayload = buildResultsPayload(clubId, matches, undefined, note);

  return (
    <main>
      <Widget
        clubName={clubName}
        clubId={clubId}
        results={payload}
        selectedTeamKey={selectedTeam?.key}
        selectedTeamName={selectedTeam?.label}
        selectedCompetitionId={selectedCompetitionId}
        availableTeams={teams}
        note={payload.note}
      />
    </main>
  );
}
