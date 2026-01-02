import { DEFAULT_CLUB_ID, getClubTeams } from "@/lib/dofa";
import { Widget } from "@/components/Widget";
import { ClubResultsPayload, ErrorPayload } from "@/types/results";

interface WidgetPageProps {
  searchParams?: {
    club?: string;
    clubName?: string;
    team?: string;
  };
}

export const revalidate = 0;

const fetchResults = async (
  clubId: string,
  competitionId?: string
): Promise<ClubResultsPayload | ErrorPayload> => {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const query = competitionId ? `?competitionId=${encodeURIComponent(competitionId)}` : "";
  const response = await fetch(`${baseUrl}/api/club/${clubId}/results${query}`, {
    next: { revalidate: 300 },
  });

  const data = (await response.json()) as ClubResultsPayload | ErrorPayload;
  if (!response.ok) {
    const message = "message" in data ? data.message : undefined;
    return { error: true, status: response.status, message };
  }

  return data;
};

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const clubId = searchParams?.club || DEFAULT_CLUB_ID;
  const clubName = searchParams?.clubName || `Club ${clubId}`;
  const requestedTeam = searchParams?.team;

  const resultsPromise = getClubTeams(clubId)
    .then(({ teams, defaultTeam }) => {
      const selectedTeam = teams.find((team) => team.competitionId === requestedTeam) || defaultTeam;
      const selectedCompetitionId = selectedTeam?.competitionId;
      const results = fetchResults(clubId, selectedCompetitionId);
      return Promise.all([Promise.resolve({ teams, defaultTeam, selectedTeam }), results]);
    })
    .catch(async () => {
      const results = await fetchResults(clubId);
      return [
        { teams: [], defaultTeam: null, selectedTeam: null },
        results,
      ] as const;
    });

  const [{ teams, defaultTeam, selectedTeam }, results] = await resultsPromise;

  if ((results as ErrorPayload).error) {
    const error = results as ErrorPayload;
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
            Statut HTTP: {error.status}
            {error.message ? ` • ${error.message}` : ""}
          </p>
        </div>
      </main>
    );
  }

  const data = results as ClubResultsPayload;

  return (
    <main>
      <Widget
        clubName={clubName}
        results={data}
        clubId={clubId}
        selectedTeamId={selectedTeam?.competitionId}
        selectedTeamName={selectedTeam?.name}
        availableTeams={teams}
      />
    </main>
  );
}
