import { ClubResults, MatchSummary, RankingSummary } from "@/types/results";
import { ClubTeam } from "@/types/teams";
import { mockedResults } from "./mockData";

export const DEFAULT_CLUB_ID = "547517";
const API_BASE = "https://api-dofa.fff.fr/api";

const normalizeMatch = (match: any, fallback?: Partial<MatchSummary>): MatchSummary => ({
  opponent:
    match?.equipeAdverse ??
    match?.adversaire ??
    match?.opponent ??
    match?.clubAdverse ??
    fallback?.opponent ??
    "Unknown opponent",
  competition:
    match?.competition ??
    match?.competitionLibelle ??
    match?.competitionLabel ??
    fallback?.competition,
  date:
    match?.date ??
    match?.dateMatch ??
    match?.journee ??
    match?.jour ??
    fallback?.date ??
    new Date().toISOString(),
  time: match?.heure ?? match?.horaire ?? match?.time ?? fallback?.time,
  isHome:
    typeof match?.domicile === "boolean"
      ? match.domicile
      : match?.home ?? match?.isHome ?? fallback?.isHome,
  score:
    match?.score ??
    match?.resultat ??
    (typeof match?.butsPour === "number" && typeof match?.butsContre === "number"
      ? `${match.butsPour}-${match.butsContre}`
      : undefined) ??
    fallback?.score,
});

const normalizeRanking = (ranking: any): RankingSummary | null => {
  if (!ranking) return null;
  const position = Number(
    ranking.position ?? ranking.rang ?? ranking.rank ?? ranking.classement
  );
  const points = Number(ranking.points ?? ranking.pts ?? ranking.totalPoints);
  if (!Number.isFinite(position) || !Number.isFinite(points)) return null;
  return { position, points };
};

const mapDofaResponse = (data: any): ClubResults | null => {
  if (!data) return null;

  const lastMatchRaw =
    data?.lastMatch ??
    data?.dernierMatch ??
    data?.resultats?.[0] ??
    data?.resultat?.[0] ??
    data?.matches?.[0];

  const nextMatchRaw =
    data?.nextMatch ?? data?.prochainMatch ?? data?.rencontres?.[0] ?? data?.upcoming?.[0];

  const rankingRaw = data?.ranking ?? data?.classement ?? data?.standings;

  const lastMatch = lastMatchRaw && normalizeMatch(lastMatchRaw);
  const nextMatch = nextMatchRaw && normalizeMatch(nextMatchRaw);
  const ranking = normalizeRanking(rankingRaw);

  if (!lastMatch || !nextMatch || !ranking) return null;

  return {
    lastMatch,
    nextMatch,
    ranking,
  };
};

export async function getClubResults(clubId: string = DEFAULT_CLUB_ID): Promise<ClubResults> {
  const activeClubId = clubId || DEFAULT_CLUB_ID;
  const fallback = mockedResults(activeClubId);
  const endpoint = `${API_BASE}/clubs/${activeClubId}/resultat`;

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`DOFA API responded with ${response.status}`);
    }

    const data = await response.json();
    const normalized = mapDofaResponse(data);

    if (!normalized) {
      throw new Error("Unable to parse DOFA API response");
    }

    return normalized;
  } catch (error) {
    console.error("Failed to fetch DOFA results", error);
    return fallback;
  }
}

const normalizeTeam = (team: any): ClubTeam | null => {
  const name =
    team?.nomEquipe ??
    team?.libelleEquipe ??
    team?.libelle ??
    team?.name ??
    team?.equipe;

  if (!name) return null;

  const competitionId =
    team?.cp_no ?? team?.cpNo ?? team?.competitionId ?? team?.competition ?? team?.cpno;

  return {
    name,
    competitionId: competitionId ? String(competitionId) : undefined,
  };
};

const mapTeamsResponse = (data: unknown): ClubTeam[] => {
  const parsed = data as { equipes?: unknown; teams?: unknown };

  const teamsArray =
    (Array.isArray(data) && data) ||
    (Array.isArray(parsed?.equipes) && parsed.equipes) ||
    (Array.isArray(parsed?.teams) && parsed.teams) ||
    [];

  return teamsArray
    .map((team: unknown) => normalizeTeam(team))
    .filter((team: ClubTeam | null): team is ClubTeam => Boolean(team));
};

const selectDefaultTeam = (teams: ClubTeam[]): ClubTeam | null => {
  if (!teams.length) return null;

  const seniorTeams = teams.filter((team) => /senior/i.test(team.name));
  const seniorA = seniorTeams.find((team) => /senior\s*A/i.test(team.name));

  if (seniorA) return seniorA;
  if (seniorTeams.length) return seniorTeams[0];

  return teams[0];
};

export async function getClubTeams(clubId: string = DEFAULT_CLUB_ID): Promise<{
  teams: ClubTeam[];
  defaultTeam: ClubTeam | null;
}> {
  const activeClubId = clubId || DEFAULT_CLUB_ID;
  const endpoint = `${API_BASE}/clubs/${activeClubId}/equipes.json?filter=`;
  const fallbackTeams: ClubTeam[] = [
    {
      name: "Senior A",
      competitionId: undefined,
    },
  ];

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`DOFA API responded with ${response.status}`);
    }

    const data = await response.json();
    const teams = mapTeamsResponse(data);
    const defaultTeam = selectDefaultTeam(teams);

    if (!teams.length) {
      throw new Error("No teams returned from DOFA API");
    }

    return { teams, defaultTeam };
  } catch (error) {
    console.error("Failed to fetch DOFA teams", error);
    const defaultTeam = selectDefaultTeam(fallbackTeams);
    return { teams: fallbackTeams, defaultTeam };
  }
}
