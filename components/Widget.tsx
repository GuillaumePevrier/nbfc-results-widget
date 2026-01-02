import styles from "./widget.module.css";
import { ClubResultsPayload } from "@/types/results";
import { ClubTeam } from "@/types/teams";
import { MatchCard } from "./MatchCard";
import { RankingCard } from "./RankingCard";

interface WidgetProps {
  clubName: string;
  clubId: string;
  results: ClubResultsPayload;
  selectedTeamKey?: string;
  selectedTeamName?: string;
  selectedCompetitionId?: string;
  availableTeams?: ClubTeam[];
  note?: string;
}

export function Widget({
  clubName,
  clubId,
  results,
  selectedTeamKey,
  selectedTeamName,
  selectedCompetitionId,
  availableTeams = [],
  note,
}: WidgetProps) {
  const selectedTeam = availableTeams.find((team) => team.key === selectedTeamKey) || null;
  const selectedCompetitionLabel =
    selectedTeam?.competitions?.find((comp) => comp.cp_no === selectedCompetitionId)?.name ||
    selectedTeam?.competitions?.[0]?.name;

  return (
    <div className={styles.widgetWrapper}>
      <header style={{ marginBottom: "12px" }}>
        <p style={{ color: "var(--muted)", fontWeight: 600, letterSpacing: 0.4 }}>
          French Football Federation • DOFA
        </p>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)" }}>
          {clubName} • Match Center
        </h2>
        {availableTeams.length ? (
          <form className={styles.teamSelector} method="get">
            <input type="hidden" name="club" value={clubId} />
            <input type="hidden" name="clubName" value={clubName} />
            <label className={styles.teamLabel} htmlFor="team">
              Sélection d'équipe
            </label>
            <div className={styles.teamControls}>
              <select
                id="team"
                name="teamKey"
                defaultValue={selectedTeamKey || ""}
                className={styles.teamSelect}
              >
                {availableTeams.map((team) => (
                  <option key={team.key} value={team.key}>
                    {team.label}
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.teamSubmit}>
                Afficher
              </button>
            </div>
            {selectedTeamName ? (
              <p className={styles.teamHelper}>
                Équipe sélectionnée : {selectedTeamName}
                {selectedCompetitionLabel ? ` • ${selectedCompetitionLabel}` : ""}
              </p>
            ) : null}
          </form>
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
