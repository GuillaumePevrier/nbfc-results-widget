import { headers } from "next/headers";
import { DEFAULT_CLUB_ID } from "@/lib/dofa";
import { Widget } from "@/components/Widget";
import { ClubResultsPayload, ErrorPayload, isErrorPayload } from "@/types/results";
import { ClubTeam } from "@/types/teams";

interface WidgetPageProps {
  searchParams?: {
    club?: string;
    team?: string;
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

const fetchInternal = async <T>(path: string) => {
  const url = buildInternalUrl(path);
  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as T;
  return { response, data };
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

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const clubParam = searchParams?.club?.trim() || DEFAULT_CLUB_ID;
  const requestedTeam = searchParams?.team?.trim();

  let teams: ClubTeam[] = [];
  let selectedTeam: ClubTeam | null = null;
  let clubName = `Club ${clubParam}`;

  try {
    const teamsResult = await fetchInternal<{ teams: ClubTeam[]; defaultTeam: ClubTeam | null } | ErrorPayload>(
      `/api/club/${clubParam}/teams`
    );

    if (!teamsResult.response.ok || isErrorPayload(teamsResult.data)) {
      teams = [];
      selectedTeam = null;
    } else {
      teams = teamsResult.data.teams ?? [];
      selectedTeam =
        teams.find((team) => requestedTeam && team.competitionId === requestedTeam) ||
        teamsResult.data.defaultTeam ||
        null;
    }
  } catch (error) {
    console.error("Failed to load teams", error);
  }

  const competitionId = selectedTeam?.competitionId || requestedTeam;

  let resultsPayload: ClubResultsPayload | null = null;
  let errorPayload: ErrorPayload | null = null;

  try {
    const resultsPath = competitionId
      ? `/api/club/${clubParam}/results?competitionId=${competitionId}`
      : `/api/club/${clubParam}/results`;

    const resultsResponse = await fetchInternal<ClubResultsPayload | ErrorPayload>(resultsPath);

    if (!resultsResponse.response.ok || isErrorPayload(resultsResponse.data)) {
      errorPayload = isErrorPayload(resultsResponse.data)
        ? resultsResponse.data
        : {
            error: true,
            status: resultsResponse.response.status,
            message: "Erreur lors du chargement des résultats",
          };
    } else {
      resultsPayload = resultsResponse.data as ClubResultsPayload;
      const clubInfoResponse = await fetchInternal<Record<string, unknown> | ErrorPayload>(
        `/api/dofa/club/${resultsPayload.clubId}`
      );
      if (clubInfoResponse.response.ok && !isErrorPayload(clubInfoResponse.data)) {
        clubName = parseClubName(clubInfoResponse.data) || clubName;
      } else if (!clubName) {
        clubName = `Club ${resultsPayload.clubId}`;
      }
    }
  } catch (error) {
    errorPayload = { error: true, status: 500, message: (error as Error)?.message };
  }

  if (errorPayload) {
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
          <p style={{ color: "#6b7280", margin: 0 }}>Impossible de récupérer les résultats du club.</p>
          <p style={{ color: "#9ca3af", marginTop: 8, fontSize: "0.85rem" }}>
            Statut HTTP: {errorPayload.status}
            {errorPayload.message ? ` • ${errorPayload.message}` : ""}
          </p>
        </div>
      </main>
    );
  }

  if (!resultsPayload) {
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
          <p style={{ color: "#6b7280", margin: 0 }}>Aucune donnée disponible pour ce club.</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Widget
        clubName={clubName}
        clubId={resultsPayload.clubId}
        results={resultsPayload}
        selectedTeamId={selectedTeam?.competitionId}
        selectedTeamName={selectedTeam?.name}
        availableTeams={teams}
        note={resultsPayload.note}
      />
    </main>
  );
}
