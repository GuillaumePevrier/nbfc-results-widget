import styles from "./widget.module.css";
import { ClubResultsPayload } from "@/types/results";
import { ClubTeam } from "@/types/teams";
import { MatchCard } from "./MatchCard";
import { RankingCard } from "./RankingCard";

interface WidgetProps {
  clubName: string;
  clubId: string;
  results: ClubResultsPayload;
  selectedTeamId?: string;
  selectedTeamName?: string;
  availableTeams?: ClubTeam[];
  note?: string;
}

export function Widget({
  clubName,
  clubId,
  results,
  selectedTeamId,
  selectedTeamName,
  availableTeams = [],
  note,
}: WidgetProps) {
  const teamsWithIds = availableTeams.filter((team) => Boolean(team.competitionId));

  return (
    <div className={styles.widgetWrapper}>
      <header style={{ marginBottom: "12px" }}>
        <p style={{ color: "var(--muted)", fontWeight: 600, letterSpacing: 0.4 }}>
          French Football Federation • DOFA
        </p>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)" }}>
          {clubName} • Match Center
        </h2>
        {teamsWithIds.length ? (
          <form className={styles.teamSelector} method="get">
            <input type="hidden" name="club" value={clubId} />
            <input type="hidden" name="clubName" value={clubName} />
            <label className={styles.teamLabel} htmlFor="team">
              Sélection d'équipe
            </label>
            <div className={styles.teamControls}>
              <select
                id="team"
                name="team"
                defaultValue={selectedTeamId || ""}
                className={styles.teamSelect}
              >
                <option value="">Toutes compétitions</option>
                {teamsWithIds.map((team) => (
                  <option key={`${team.name}-${team.competitionId}`} value={team.competitionId}>
                    {team.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.teamSubmit}>
                Afficher
              </button>
            </div>
            {selectedTeamName ? (
              <p className={styles.teamHelper}>Équipe sélectionnée : {selectedTeamName}</p>
            ) : null}
          </form>
        ) : selectedTeamName ? (
          <p style={{ color: "var(--muted)", marginTop: 4 }}>
            Équipe par défaut : {selectedTeamName}
          </p>
        ) : availableTeams.length ? (
          <p style={{ color: "var(--muted)", marginTop: 4 }}>
            Équipes disponibles : {availableTeams.length}
          </p>
        ) : null}
      </header>
      <section className={styles.widgetCard}>
        {note ? <p className={styles.note}>{note}</p> : null}
        <MatchCard
          title="Dernier match"
          badge="Terminé"
          match={results.lastMatch}
          showScore
        />
        <MatchCard
          title="Prochain match"
          badge="À venir"
          match={results.nextMatch}
          emptyText="Aucun match à venir"
        />
        <RankingCard ranking={results.ranking ?? null} />
      </section>
    </div>
  );
}
