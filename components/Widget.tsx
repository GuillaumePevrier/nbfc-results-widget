import styles from "./widget.module.css";
import { ClubResults } from "@/types/results";
import { ClubTeam } from "@/types/teams";
import { MatchCard } from "./MatchCard";
import { RankingCard } from "./RankingCard";

interface WidgetProps {
  clubName: string;
  results: ClubResults;
  selectedTeamName?: string;
  availableTeams?: ClubTeam[];
}

export function Widget({
  clubName,
  results,
  selectedTeamName,
  availableTeams = [],
}: WidgetProps) {
  return (
    <div className={styles.widgetWrapper}>
      <header style={{ marginBottom: "12px" }}>
        <p style={{ color: "var(--muted)", fontWeight: 600, letterSpacing: 0.4 }}>
          French Football Federation • DOFA
        </p>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)" }}>
          {clubName} • Match Center
        </h2>
        {selectedTeamName ? (
          <p style={{ color: "var(--muted)", marginTop: 4 }}>
            Default team: {selectedTeamName}
          </p>
        ) : null}
        {!selectedTeamName && availableTeams.length ? (
          <p style={{ color: "var(--muted)", marginTop: 4 }}>
            Teams available: {availableTeams.length}
          </p>
        ) : null}
      </header>
      <section className={styles.widgetCard}>
        <MatchCard
          title="Last match"
          badge="Full time"
          match={results.lastMatch}
          showScore
        />
        <MatchCard
          title="Next match"
          badge="Upcoming"
          match={results.nextMatch}
        />
        <RankingCard ranking={results.ranking} />
      </section>
    </div>
  );
}
