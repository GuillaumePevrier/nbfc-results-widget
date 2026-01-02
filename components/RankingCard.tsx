import styles from "./widget.module.css";
import { RankingSummary } from "@/types/results";

interface RankingCardProps {
  ranking: RankingSummary;
}

export function RankingCard({ ranking }: RankingCardProps) {
  return (
    <div className={`${styles.section} ${styles.rankingCard}`}>
      <div className={styles.sectionHeader}>
        <span className={styles.titleAccent}>Ranking</span>
        <span className={styles.badge}>Summary</span>
      </div>
      <div className={styles.rankNumber}>#{ranking.position}</div>
      <div className={styles.points}>
        <span>Points</span>
        <strong>{ranking.points}</strong>
      </div>
      <p className={styles.meta}>
        Updated dynamically from the French Football Federation (FFF) DOFA API.
      </p>
    </div>
  );
}
