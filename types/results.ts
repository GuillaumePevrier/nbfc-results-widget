export type MatchSummary = {
  opponent: string;
  competition?: string;
  date: string;
  time?: string;
  isHome?: boolean;
  score?: string;
};

export type RankingSummary = {
  position: number;
  points: number;
};

export type ClubResults = {
  lastMatch: MatchSummary;
  nextMatch: MatchSummary;
  ranking: RankingSummary;
};
