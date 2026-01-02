import styles from "./widget.module.css";

interface RankingCardProps {
  ranking?: { position?: number; points?: number } | null;
}

export function RankingCard({ ranking }: RankingCardProps) {
  const hasData =
    ranking !== null &&
    ranking !== undefined &&
    ranking.position !== undefined &&
    ranking.points !== undefined;

  return (
    <div className={`${styles.section} ${styles.rankingCard}`}>
      <div className={styles.sectionHeader}>
        <span className={styles.titleAccent}>Classement</span>
        <span className={styles.badge}>Résumé</span>
      </div>
      {hasData ? (
        <>
          <div className={styles.rankNumber}>#{ranking!.position}</div>
          <div className={styles.points}>
            <span>Points</span>
            <strong>{ranking!.points}</strong>
          </div>
        </>
      ) : (
        <div className={styles.meta}>Données indisponibles</div>
      )}
      <p className={styles.meta}>
        Données issues de la Fédération Française de Football (FFF) • DOFA.
      </p>
    </div>
  );
}
