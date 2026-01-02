import { ClubTeam } from "@/types/teams";
import { MatchDetails } from "@/types/results";

export const DEFAULT_CLUB_ID = "24824";
const API_BASE = "https://api-dofa.fff.fr/api";

const toDateValue = (value: unknown): string | null => {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const getCompetitionIdentifier = (entry: Record<string, unknown>): string | null => {
  const raw =
    entry["cp_no"] ??
    entry.cpNo ??
    entry.cpno ??
    entry.competitionId ??
    entry["competition_id"] ??
    entry.competition;

  if (raw === undefined || raw === null) return null;

  if (typeof raw === "number" || typeof raw === "string") {
    const normalized = String(raw).trim();
    return normalized.length ? normalized : null;
  }

  return null;
};

const normalizeMatchDetails = (
  match: unknown
): (MatchDetails & { rawDate: string; competitionId: string | null }) | null => {
  if (!match || typeof match !== "object") return null;
  const entry = match as Record<string, unknown>;

  const date =
    toDateValue(entry.date as string) ||
    toDateValue((entry as Record<string, string>).dateMatch) ||
    toDateValue((entry as Record<string, string>).jour) ||
    toDateValue((entry as Record<string, string>).journee);

  if (!date) return null;

  const homeName =
    (entry.clubReceveur as string) ||
    (entry.clubRecevant as string) ||
    (entry.clubDomicile as string) ||
    (entry.equipeDomicile as string) ||
    (entry.homeTeam as string) ||
    (entry.home as string) ||
    (entry.equipeHome as string);

  const awayName =
    (entry.clubVisiteur as string) ||
    (entry.clubExterieur as string) ||
    (entry.equipeExterieure as string) ||
    (entry.awayTeam as string) ||
    (entry.away as string) ||
    (entry.equipeAway as string);

  const competitionName =
    (entry.competitionLibelle as string) ||
    (entry.competitionLabel as string) ||
    (entry.competition as string) ||
    (entry.libelleCompetition as string);

  const competitionId = getCompetitionIdentifier(entry);

  const venueCity = (entry.ville as string) || (entry.lieu as string) || (entry.stade as string);

  const homeScore =
    typeof entry.butsPour === "number"
      ? (entry.butsPour as number)
      : typeof entry.home_score === "number"
        ? (entry.home_score as number)
        : typeof entry.scoreDomicile === "number"
          ? (entry.scoreDomicile as number)
          : undefined;

  const awayScore =
    typeof entry.butsContre === "number"
      ? (entry.butsContre as number)
      : typeof entry.away_score === "number"
        ? (entry.away_score as number)
        : typeof entry.scoreExterieur === "number"
          ? (entry.scoreExterieur as number)
          : undefined;

  const time = (entry.heure as string) || (entry.horaire as string) || (entry.time as string);

  return {
    rawDate: date,
    date,
    time,
    homeName,
    awayName,
    homeScore,
    awayScore,
    competitionName,
    venueCity,
    competitionId,
  };
};

const findLastAndNextMatches = (
  matches: unknown[],
  competitionId?: string
): {
  lastMatch: MatchDetails | null;
  nextMatch: MatchDetails | null;
} => {
  const normalized = matches
    .map((match) => normalizeMatchDetails(match))
    .filter(
      (match): match is MatchDetails & { rawDate: string; competitionId: string | null } =>
        Boolean(match)
    )
    .filter((match) =>
      competitionId ? match.competitionId === competitionId : true
    );

  if (!normalized.length) return { lastMatch: null, nextMatch: null };

  const now = Date.now();

  const completed = normalized.filter(
    (match) => match.homeScore !== undefined && match.awayScore !== undefined
  );
  completed.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const upcoming = normalized.filter(
    (match) => (match.homeScore === undefined || match.awayScore === undefined) && new Date(match.rawDate).getTime() >= now
  );
  upcoming.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

  return {
    lastMatch: completed[0] ?? null,
    nextMatch: upcoming[0] ?? null,
  };
};

export async function fetchClubResults(
  clubId: string = DEFAULT_CLUB_ID,
  competitionId?: string
): Promise<{ lastMatch: MatchDetails | null; nextMatch: MatchDetails | null }> {
  const activeClubId = clubId || DEFAULT_CLUB_ID;
  const endpoint = `${API_BASE}/clubs/${activeClubId}/resultat`;

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; nbfc-results-widget/1.0)",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const error = new Error(`DOFA API responded with ${response.status}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const data = (await response.json()) as { "hydra:member"?: unknown[]; resultat?: unknown[] };
  const matches =
    (Array.isArray(data?.["hydra:member"]) && data["hydra:member"]) ||
    (Array.isArray(data?.resultat) && data.resultat) ||
    [];

  const { lastMatch, nextMatch } = findLastAndNextMatches(matches, competitionId);

  return { lastMatch, nextMatch };
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

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; nbfc-results-widget/1.0)",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const error = new Error(`DOFA API responded with ${response.status}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const teams = mapTeamsResponse(data);
  const defaultTeam = selectDefaultTeam(teams);

  return { teams, defaultTeam };
}
