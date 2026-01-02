import styles from "./widget.module.css";
import { MatchSummary } from "@/types/results";

interface MatchCardProps {
  title: string;
  badge: string;
  match: MatchSummary;
  showScore?: boolean;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const venueLabel = (isHome?: boolean) => {
  if (isHome === undefined) return "Venue TBC";
  return isHome ? "Home" : "Away";
};

export function MatchCard({ title, badge, match, showScore }: MatchCardProps) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.titleAccent}>{title}</span>
        <span className={styles.badge}>{badge}</span>
      </div>
      <div>
        <div className={styles.matchOpp}>{match.opponent}</div>
        <div className={styles.meta}>{match.competition ?? "Competition"}</div>
      </div>
      <div className={styles.meta}>
        {formatDate(match.date)} {match.time ? `• ${match.time}` : ""}
      </div>
      {showScore ? (
        <div className={styles.score}>{match.score ?? "-"}</div>
      ) : (
        <div className={styles.homeAway}>{venueLabel(match.isHome)}</div>
      )}
    </div>
  );
}
