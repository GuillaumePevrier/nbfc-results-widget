import styles from "./widget.module.css";
import { ClubResults } from "@/types/results";
import { MatchCard } from "./MatchCard";
import { RankingCard } from "./RankingCard";

interface WidgetProps {
  clubName: string;
  results: ClubResults;
}

export function Widget({ clubName, results }: WidgetProps) {
  return (
    <div className={styles.widgetWrapper}>
      <header style={{ marginBottom: "12px" }}>
        <p style={{ color: "var(--muted)", fontWeight: 600, letterSpacing: 0.4 }}>
          French Football Federation • DOFA
        </p>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)" }}>
          {clubName} • Match Center
        </h2>
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
