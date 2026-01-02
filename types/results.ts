export type MatchDetails = {
  date: string;
  time?: string;
  homeName?: string;
  awayName?: string;
  homeScore?: number;
  awayScore?: number;
  competitionName?: string;
  competitionId?: string | null;
  venueCity?: string;
};

export type RankingSummary = {
  position: number;
  points?: number;
  competitionName?: string;
};

export type ClubResultsPayload = {
  clubId: string;
  lastMatch: MatchDetails | null;
  nextMatch: MatchDetails | null;
  ranking?: RankingSummary | null;
  updatedAt: string;
  note?: string;
};

export type ErrorPayload = {
  error: true;
  status: number;
  message?: string;
  detail?: string;
};

export const isErrorPayload = (value: unknown): value is ErrorPayload => {
  return (
    !!value &&
    typeof value === "object" &&
    "error" in value &&
    (value as { error: unknown }).error === true &&
    typeof (value as { status?: unknown }).status === "number"
  );
};
