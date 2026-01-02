import { ClubResults, MatchSummary, RankingSummary } from "@/types/results";
import { mockedResults } from "./mockData";

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

export async function getClubResults(clubId: string): Promise<ClubResults> {
  const fallback = mockedResults(clubId);
  if (!clubId) return fallback;

  const endpoint = `${API_BASE}/clubs/${clubId}/resultat`;

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
