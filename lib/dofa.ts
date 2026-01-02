import { ClubTeam } from "@/types/teams";
import { ClubResultsPayload, MatchDetails, RankingSummary } from "@/types/results";

export const DEFAULT_CLUB_ID = "24824";
const API_BASE = "https://api-dofa.fff.fr/api";

const DEFAULT_HEADERS = {
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; nbfc-results-widget/1.0)",
};

const withStatusError = async (response: Response) => {
  if (response.ok) return response;
  const error = new Error(`DOFA API responded with ${response.status}`) as Error & {
    status?: number;
  };
  error.status = response.status;
  throw error;
};

const fetchJson = async (path: string) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 300 },
  });

  await withStatusError(response);
  return response.json();
};

const toIsoString = (value: unknown): string | null => {
  if (!value || typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
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
    toIsoString(entry.date) ||
    toIsoString((entry as Record<string, string>).dateMatch) ||
    toIsoString((entry as Record<string, string>).jour) ||
    toIsoString((entry as Record<string, string>).journee);

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
): { lastMatch: MatchDetails | null; nextMatch: MatchDetails | null } => {
  const normalized = matches
    .map((match) => normalizeMatchDetails(match))
    .filter(
      (match): match is MatchDetails & { rawDate: string; competitionId: string | null } =>
        Boolean(match)
    )
    .filter((match) => (competitionId ? match.competitionId === competitionId : true));

  if (!normalized.length) return { lastMatch: null, nextMatch: null };

  const now = Date.now();

  const completed = normalized.filter(
    (match) => match.homeScore !== undefined && match.awayScore !== undefined
  );
  completed.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const upcoming = normalized.filter((match) => {
    const matchTime = new Date(match.rawDate).getTime();
    const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;
    return !hasScore && matchTime >= now;
  });
  upcoming.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

  return {
    lastMatch: completed[0] ?? null,
    nextMatch: upcoming[0] ?? null,
  };
};

export const fetchClubInfo = async (
  clubId: string = DEFAULT_CLUB_ID
): Promise<{ name?: string; city?: string } | null> => {
  try {
    const data = (await fetchJson(`/clubs/${clubId}.json`)) as Record<string, unknown>;
    return {
      name:
        (data["nom"] as string) ||
        (data["nomClub"] as string) ||
        (data["name"] as string) ||
        (data["club"] as string),
      city: (data["ville"] as string) || (data["city"] as string),
    };
  } catch (error) {
    console.error("Failed to fetch club info", error);
    return null;
  }
};

export async function fetchClubResults(
  clubId: string = DEFAULT_CLUB_ID,
  competitionId?: string
): Promise<{ lastMatch: MatchDetails | null; nextMatch: MatchDetails | null }> {
  const activeClubId = clubId || DEFAULT_CLUB_ID;
  const data = (await fetchJson(`/clubs/${activeClubId}/resultat`)) as {
    "hydra:member"?: unknown[];
    resultat?: unknown[];
  };

  const matches =
    (Array.isArray(data?.["hydra:member"]) && data["hydra:member"]) ||
    (Array.isArray(data?.resultat) && data.resultat) ||
    [];

  return findLastAndNextMatches(matches, competitionId);
}

const normalizeTeam = (team: unknown): ClubTeam | null => {
  if (!team || typeof team !== "object") return null;
  const entry = team as Record<string, unknown>;

  const name =
    (entry["nomEquipe"] as string) ||
    (entry["libelleEquipe"] as string) ||
    (entry["libelle"] as string) ||
    (entry["name"] as string) ||
    (entry["equipe"] as string);

  if (!name) return null;

  const competitionId =
    entry["cp_no"] ?? entry["cpNo"] ?? entry["competitionId"] ?? entry["competition"] ?? entry["cpno"];

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
  const data = await fetchJson(`/clubs/${activeClubId}/equipes.json?filter=`);
  const teams = mapTeamsResponse(data);
  const defaultTeam = selectDefaultTeam(teams);

  return { teams, defaultTeam };
}

const extractRankingEntry = (entry: Record<string, unknown>): RankingSummary | null => {
  const positionRaw = entry["position"] ?? entry["rang"] ?? entry["classement"] ?? entry["rank"];
  const pointsRaw = entry["points"] ?? entry["pts"] ?? entry["nbPoints"];
  const competitionName =
    (entry["competition"] as string) ||
    (entry["competitionLibelle"] as string) ||
    (entry["libelleCompetition"] as string);

  const positionNumber =
    typeof positionRaw === "number"
      ? positionRaw
      : typeof positionRaw === "string"
        ? Number.parseInt(positionRaw, 10)
        : undefined;

  if (!positionNumber || Number.isNaN(positionNumber)) return null;

  const points =
    typeof pointsRaw === "number"
      ? pointsRaw
      : typeof pointsRaw === "string"
        ? Number.parseInt(pointsRaw, 10)
        : undefined;

  return {
    position: positionNumber,
    points,
    competitionName,
  };
};

export const fetchCompetitionRanking = async (
  competitionId?: string,
  clubName?: string
): Promise<RankingSummary | null> => {
  if (!competitionId) return null;

  try {
    const data = (await fetchJson(`/competitions/${competitionId}/classement`)) as {
      "hydra:member"?: unknown[];
      classement?: unknown[];
    };

    const entries =
      (Array.isArray(data?.["hydra:member"]) && data["hydra:member"]) ||
      (Array.isArray(data?.classement) && data.classement) ||
      [];

    const normalized = entries
      .map((item) => (item && typeof item === "object" ? extractRankingEntry(item as Record<string, unknown>) : null))
      .filter((entry: RankingSummary | null): entry is RankingSummary => Boolean(entry));

    if (!normalized.length) return null;

    if (clubName) {
      const match = entries.find((item) => {
        if (!item || typeof item !== "object") return false;
        const entry = item as Record<string, unknown>;
        const nameCandidate =
          (entry["club"] as string) ||
          (entry["nomClub"] as string) ||
          (entry["club_nom"] as string) ||
          (entry["equipe"] as string) ||
          (entry["equipe_nom"] as string);
        return nameCandidate
          ? nameCandidate.toLowerCase().includes(clubName.toLowerCase()) ||
              clubName.toLowerCase().includes(nameCandidate.toLowerCase())
          : false;
      });

      if (match && typeof match === "object") {
        const normalizedMatch = extractRankingEntry(match as Record<string, unknown>);
        if (normalizedMatch) return normalizedMatch;
      }
    }

    return normalized[0] ?? null;
  } catch (error) {
    console.error("Unable to load ranking", error);
    return null;
  }
};

export const buildResultsPayload = (
  clubId: string,
  matches: { lastMatch: MatchDetails | null; nextMatch: MatchDetails | null },
  ranking?: RankingSummary | null
): ClubResultsPayload => ({
  clubId,
  lastMatch: matches.lastMatch,
  nextMatch: matches.nextMatch,
  ranking,
  updatedAt: new Date().toISOString(),
});
