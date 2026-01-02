import styles from "./widget.module.css";
import { MatchDetails } from "@/types/results";

interface MatchCardProps {
  title: string;
  badge: string;
  match: MatchDetails | null;
  showScore?: boolean;
  emptyText?: string;
}

const formatDate = (value?: string) => {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const formatTeamLine = (home?: string, away?: string) => {
  if (!home && !away) return "Équipes indisponibles";
  if (!home) return `? vs ${away}`;
  if (!away) return `${home} vs ?`;
  return `${home} vs ${away}`;
};

export function MatchCard({ title, badge, match, showScore, emptyText }: MatchCardProps) {
  if (!match) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.titleAccent}>{title}</span>
          <span className={styles.badge}>{badge}</span>
        </div>
        <div className={styles.matchOpp}>{emptyText || "Aucun match disponible"}</div>
        <div className={styles.meta}>Aucune information récupérée</div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.titleAccent}>{title}</span>
        <span className={styles.badge}>{badge}</span>
      </div>
      <div>
        <div className={styles.matchOpp}>
          {formatTeamLine(match.homeName, match.awayName)}
        </div>
        <div className={styles.meta}>{match.competitionName ?? "Compétition inconnue"}</div>
      </div>
      <div className={styles.meta}>
        {formatDate(match.date)} {match.time ? `• ${match.time}` : ""}
        {match.venueCity ? ` • ${match.venueCity}` : ""}
      </div>
      {showScore ? (
        <div className={styles.score}>
          {match.homeScore !== undefined && match.awayScore !== undefined
            ? `${match.homeScore} - ${match.awayScore}`
            : "-"}
        </div>
      ) : (
        <div className={styles.homeAway}>{match.venueCity ?? "Lieu à confirmer"}</div>
      )}
    </div>
  );
}
