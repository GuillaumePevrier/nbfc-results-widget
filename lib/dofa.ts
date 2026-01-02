import { ClubTeam, TeamCompetition } from "@/types/teams";
import { ClubResultsPayload, MatchDetails, RankingSummary } from "@/types/results";

export const DEFAULT_CLUB_ID = "24824";
const API_BASE = "https://api-dofa.fff.fr/api";

export const DOFA_HEADERS = {
  Accept: "application/json",
  "User-Agent": "nbfc-results-widget/1.0 (Vercel)",
};

const toIsoString = (value: unknown): string | null => {
  if (!value || typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const getCompetitionIdentifier = (entry: Record<string, unknown>): string | null => {
  const raw =
    entry["cp_no"] ??
    entry["cpNo"] ??
    entry["cpno"] ??
    entry["competitionId"] ??
    entry["competition"] ??
    entry["competition_id"];

  if (raw === undefined || raw === null) return null;

  if (typeof raw === "number" || typeof raw === "string") {
    const normalized = String(raw).trim();
    return normalized.length ? normalized : null;
  }

  return null;
};

export type NormalizedMatch = MatchDetails & { rawDate: string };

export const normalizeMatchDetails = (match: unknown): NormalizedMatch | null => {
  if (!match || typeof match !== "object") return null;
  const entry = match as Record<string, unknown>;

  const date =
    toIsoString(entry["date"]) ||
    toIsoString((entry as Record<string, string>)["dateMatch"]) ||
    toIsoString((entry as Record<string, string>)["jour"]) ||
    toIsoString((entry as Record<string, string>)["journee"]);

  if (!date) return null;

  const homeName =
    (entry["clubReceveur"] as string) ||
    (entry["clubRecevant"] as string) ||
    (entry["clubDomicile"] as string) ||
    (entry["equipeDomicile"] as string) ||
    (entry["homeTeam"] as string) ||
    (entry["home"] as string) ||
    (entry["equipeHome"] as string);

  const awayName =
    (entry["clubVisiteur"] as string) ||
    (entry["clubExterieur"] as string) ||
    (entry["equipeExterieure"] as string) ||
    (entry["awayTeam"] as string) ||
    (entry["away"] as string) ||
    (entry["equipeAway"] as string);

  const competitionName =
    (entry["competitionLibelle"] as string) ||
    (entry["competitionLabel"] as string) ||
    (entry["competition"] as string) ||
    (entry["libelleCompetition"] as string);

  const competitionId = getCompetitionIdentifier(entry);

  const venueCity = (entry["ville"] as string) || (entry["lieu"] as string) || (entry["stade"] as string);

  const homeScore =
    typeof entry["butsPour"] === "number"
      ? (entry["butsPour"] as number)
      : typeof entry["home_score"] === "number"
        ? (entry["home_score"] as number)
        : typeof entry["scoreDomicile"] === "number"
          ? (entry["scoreDomicile"] as number)
          : undefined;

  const awayScore =
    typeof entry["butsContre"] === "number"
      ? (entry["butsContre"] as number)
      : typeof entry["away_score"] === "number"
        ? (entry["away_score"] as number)
        : typeof entry["scoreExterieur"] === "number"
          ? (entry["scoreExterieur"] as number)
          : undefined;

  const time = (entry["heure"] as string) || (entry["horaire"] as string) || (entry["time"] as string);

  return {
    rawDate: date,
    date,
    time,
    homeName,
    awayName,
    homeScore,
    awayScore,
    competitionName,
    competitionId,
    venueCity,
  };
};

export const extractClubNumber = (data: unknown): string | null => {
  if (!data || typeof data !== "object") return null;
  const entry = data as Record<string, unknown>;
  const raw = entry["cl_no"] ?? entry["clNo"] ?? entry["clno"];
  if (typeof raw === "number" || typeof raw === "string") {
    const normalized = String(raw).trim();
    return normalized.length ? normalized : null;
  }
  return null;
};

export const parseMatches = (
  resultsData: unknown,
  calendarData?: unknown,
  competitionId?: string
): { lastMatch: MatchDetails | null; nextMatch: MatchDetails | null } => {
  const resultEntries = (Array.isArray((resultsData as { "hydra:member"?: unknown[] })?.["hydra:member"]) &&
    (resultsData as { "hydra:member"?: unknown[] })?.["hydra:member"]) ||
    (Array.isArray((resultsData as { resultat?: unknown[] })?.resultat) &&
      (resultsData as { resultat?: unknown[] })?.resultat) ||
    [];

  const calendarEntries = (Array.isArray((calendarData as { "hydra:member"?: unknown[] })?.["hydra:member"]) &&
    (calendarData as { "hydra:member"?: unknown[] })?.["hydra:member"]) ||
    (Array.isArray((calendarData as { calendrier?: unknown[] })?.calendrier) &&
      (calendarData as { calendrier?: unknown[] })?.calendrier) ||
    [];

  const normalizedResults = resultEntries
    .map((entry) => normalizeMatchDetails(entry))
    .filter((match): match is NormalizedMatch => Boolean(match))
    .filter((match) => (competitionId ? match.competitionId === competitionId : true));

  const normalizedCalendar = calendarEntries
    .map((entry) => normalizeMatchDetails(entry))
    .filter((match): match is NormalizedMatch => Boolean(match))
    .filter((match) => (competitionId ? match.competitionId === competitionId : true));

  const now = Date.now();

  const completed = normalizedResults.filter(
    (match) => match.homeScore !== undefined && match.awayScore !== undefined
  );
  completed.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const futureFromResults = normalizedResults.filter((match) => {
    const matchTime = new Date(match.rawDate).getTime();
    const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;
    return !hasScore && matchTime >= now;
  });

  const futureMatches = [...normalizedCalendar, ...futureFromResults];
  futureMatches.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

  return {
    lastMatch: completed[0] ?? null,
    nextMatch: futureMatches[0] ?? null,
  };
};

export const buildResultsPayload = (
  clubId: string,
  matches: { lastMatch: MatchDetails | null; nextMatch: MatchDetails | null },
  ranking?: RankingSummary | null,
  note?: string
): ClubResultsPayload => ({
  clubId,
  lastMatch: matches.lastMatch,
  nextMatch: matches.nextMatch,
  ranking,
  note,
  updatedAt: new Date().toISOString(),
});

export const mapMatchList = (
  data: unknown,
  competitionId?: string | null
): MatchDetails[] => {
  const parsed = data as { "hydra:member"?: unknown; matches?: unknown };
  const entries =
    (Array.isArray(parsed?.["hydra:member"]) && parsed["hydra:member"]) ||
    (Array.isArray(parsed?.matches) && parsed.matches) ||
    [];

  return entries
    .map((item) => normalizeMatchDetails(item))
    .filter((match): match is NormalizedMatch => Boolean(match))
    .filter((match) => (competitionId ? match.competitionId === competitionId : true))
    .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
};

const fetchJson = async (path: string) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: DOFA_HEADERS,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`DOFA API responded with status ${response.status}`);
  }

  return response.json();
};

const normalizeTeam = (team: unknown, index: number): ClubTeam | null => {
  if (!team || typeof team !== "object") return null;
  const entry = team as Record<string, unknown>;

  const category_code =
    (entry["categorie_code"] as string) ||
    (entry["category_code"] as string) ||
    (entry["categoryCode"] as string);
  const category_label =
    (entry["categorie_libelle"] as string) ||
    (entry["category_label"] as string) ||
    (entry["categoryLabel"] as string);
  const number =
    (entry["numero"] as string) ||
    (entry["number"] as string) ||
    (typeof entry["numEquipe"] === "number" ? String(entry["numEquipe"]) : undefined);
  const code = (entry["code"] as string) || (entry["equipe_code"] as string);

  const competitionsRaw = Array.isArray((entry as { engagements?: unknown[] })?.engagements)
    ? ((entry as { engagements: unknown[] }).engagements as unknown[])
    : Array.isArray((entry as { competitions?: unknown[] })?.competitions)
      ? ((entry as { competitions: unknown[] }).competitions as unknown[])
      : [];

  const competitions: TeamCompetition[] = competitionsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const comp = item as Record<string, unknown>;
      const cp_no = comp["cp_no"] ?? comp["cpNo"] ?? comp["competitionId"] ?? comp["competition"];
      if (cp_no === undefined || cp_no === null) return null;
      return {
        cp_no: String(cp_no),
        name:
          (comp["libelle"] as string) ||
          (comp["libelleCompetition"] as string) ||
          (comp["competition_libelle"] as string) ||
          (comp["name"] as string),
        type: (comp["type"] as string) || (comp["typ"] as string),
        level: (comp["niveau"] as string) || (comp["level"] as string),
      } as TeamCompetition;
    })
    .filter((entry: TeamCompetition | null): entry is TeamCompetition => Boolean(entry));

  const labelParts = [category_label || category_code, number ? `Equipe ${number}` : null, code];
  const label =
    (entry["nomEquipe"] as string) ||
    (entry["libelleEquipe"] as string) ||
    (entry["libelle"] as string) ||
    labelParts.filter(Boolean).join(" • ");

  if (!label) return null;

  const keyBase = `${category_code || "team"}-${number || index + 1}-${code || label}`;

  return {
    key: keyBase,
    label,
    category_code: category_code || undefined,
    category_label: category_label || undefined,
    number,
    code,
    competitions,
  };
};

export const mapTeamsResponse = (data: unknown): ClubTeam[] => {
  const parsed = data as { equipes?: unknown; teams?: unknown };

  const teamsArray =
    (Array.isArray(data) && data) ||
    (Array.isArray(parsed?.equipes) && parsed.equipes) ||
    (Array.isArray(parsed?.teams) && parsed.teams) ||
    [];

  return teamsArray
    .map((team: unknown, index: number) => normalizeTeam(team, index))
    .filter((team: ClubTeam | null): team is ClubTeam => Boolean(team));
};

export const selectDefaultTeam = (teams: ClubTeam[]): ClubTeam | null => teams[0] ?? null;

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
    const response = await fetch(`${API_BASE}/competitions/${competitionId}/classement`, {
      headers: DOFA_HEADERS,
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { "hydra:member"?: unknown[]; classement?: unknown[] };

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
