import styles from "./widget.module.css";

interface RankingCardProps {
  ranking?: { position?: number; points?: number; competitionName?: string } | null;
}

export function RankingCard({ ranking }: RankingCardProps) {
  const hasPosition = ranking !== null && ranking !== undefined && ranking.position !== undefined;

  return (
    <div className={`${styles.section} ${styles.rankingCard}`}>
      <div className={styles.sectionHeader}>
        <span className={styles.titleAccent}>Classement</span>
        <span className={styles.badge}>Résumé</span>
      </div>
      {hasPosition ? (
        <>
          <div className={styles.rankNumber}>#{ranking!.position}</div>
          <div className={styles.points}>
            <span>Points</span>
            <strong>{ranking!.points ?? "-"}</strong>
          </div>
          {ranking?.competitionName ? (
            <p className={styles.meta}>{ranking.competitionName}</p>
          ) : null}
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
