export type MatchDetails = {
  date: string;
  time?: string;
  homeName?: string;
  awayName?: string;
  homeScore?: number;
  awayScore?: number;
  competitionName?: string;
  venueCity?: string;
};

export type ClubResultsPayload = {
  clubId: string;
  lastMatch: MatchDetails | null;
  nextMatch: MatchDetails | null;
  updatedAt: string;
};

export type ErrorPayload = {
  error: true;
  status: number;
  message?: string;
};
