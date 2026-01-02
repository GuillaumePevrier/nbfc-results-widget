import { DEFAULT_CLUB_ID, getClubResults, getClubTeams } from "@/lib/dofa";
import { Widget } from "@/components/Widget";

interface WidgetPageProps {
  searchParams?: {
    club?: string;
    clubName?: string;
  };
}

export const revalidate = 0;

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const clubId = searchParams?.club || DEFAULT_CLUB_ID;
  const clubName = searchParams?.clubName || `Club ${clubId}`;

  const [results, { defaultTeam, teams }] = await Promise.all([
    getClubResults(clubId),
    getClubTeams(clubId),
  ]);

  return (
    <main>
      <Widget
        clubName={clubName}
        results={results}
        selectedTeamName={defaultTeam?.name}
        availableTeams={teams}
      />
    </main>
  );
}
