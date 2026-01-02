import { ClubResults } from "@/types/results";

export const mockedResults = (clubId: string): ClubResults => ({
  lastMatch: {
    opponent: "Marseille FC",
    competition: "Ligue Régionale",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    score: "2-1",
    isHome: true,
  },
  nextMatch: {
    opponent: "Lyon FC",
    competition: "Coupe Nationale",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    time: "18:30",
    isHome: false,
  },
  ranking: {
    position: 4,
    points: 32,
  },
});
