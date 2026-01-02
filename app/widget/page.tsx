import {
  DEFAULT_CLUB_ID,
  buildResultsPayload,
  fetchClubInfo,
  fetchClubResults,
  fetchCompetitionRanking,
  getClubTeams,
} from "@/lib/dofa";
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

const loadTeams = async (clubId: string): Promise<{ teams: ClubTeam[]; defaultTeam: ClubTeam | null }> => {
  try {
    return await getClubTeams(clubId);
  } catch (error) {
    console.error("Failed to load teams", error);
    return { teams: [], defaultTeam: null };
  }
};

const loadResults = async (
  clubId: string,
  competitionId?: string
): Promise<ClubResultsPayload | ErrorPayload> => {
  try {
    const matches = await fetchClubResults(clubId, competitionId);
    const ranking = await fetchCompetitionRanking(competitionId);

    if (!matches.lastMatch && !matches.nextMatch) {
      return { error: true, status: 502, message: "Aucun match disponible" };
    }

    return buildResultsPayload(clubId, matches, ranking);
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 502;
    const message = (error as Error)?.message ?? "Erreur lors de la récupération des données";
    return { error: true, status, message };
  }
};

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const clubId = searchParams?.club || DEFAULT_CLUB_ID;
  const requestedTeam = searchParams?.team;

  const [clubInfo, teamData] = await Promise.all([fetchClubInfo(clubId), loadTeams(clubId)]);

  const teams = teamData.teams;
  const defaultTeam = teamData.defaultTeam;

  const selectedTeam =
    teams.find((team) => requestedTeam && team.competitionId === requestedTeam) || defaultTeam || null;

  const selectedCompetitionId = selectedTeam?.competitionId;

  const results = await loadResults(clubId, selectedCompetitionId);

  if (isErrorPayload(results)) {
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
            Statut HTTP: {results.status}
            {results.message ? ` • ${results.message}` : ""}
          </p>
        </div>
      </main>
    );
  }

  const clubName = clubInfo?.name || `Club ${clubId}`;

  return (
    <main>
      <Widget
        clubName={clubName}
        clubId={clubId}
        results={results}
        selectedTeamId={selectedTeam?.competitionId}
        selectedTeamName={selectedTeam?.name}
        availableTeams={teams}
      />
    </main>
  );
}
