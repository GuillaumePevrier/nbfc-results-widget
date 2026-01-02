import styles from "./widget.module.css";
import { ClubResultsPayload, MatchDetails } from "@/types/results";
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
  matchList?: MatchDetails[];
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
  matchList = [],
}: WidgetProps) {
  const selectedTeam = availableTeams.find((team) => team.key === selectedTeamKey) || null;
  const selectedCompetitionLabel =
    selectedTeam?.competitions?.find((comp) => comp.cp_no === selectedCompetitionId)?.name ||
    selectedTeam?.competitions?.[0]?.name;

  const competitions = selectedTeam?.competitions || [];

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
              {competitions.length ? (
                <select
                  id="competition"
                  name="cpNo"
                  defaultValue={selectedCompetitionId || ""}
                  className={styles.teamSelect}
                >
                  <option value="">Toutes compétitions</option>
                  {competitions.map((comp) => (
                    <option key={comp.cp_no} value={comp.cp_no}>
                      {comp.name || `Compétition ${comp.cp_no}`}
                    </option>
                  ))}
                </select>
              ) : null}
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
        <div className={styles.matchList}>
          <h3>Liste des matchs</h3>
          {matchList.length === 0 ? (
            <p className={styles.note}>Aucun match disponible</p>
          ) : (
            <ul className={styles.matchItems}>
              {matchList.map((match, index) => (
                <li key={`${match.date}-${index}`} className={styles.matchItem}>
                  <div>
                    <div className={styles.matchTitle}>
                      {match.homeName || "Domicile"} vs {match.awayName || "Extérieur"}
                    </div>
                    <div className={styles.matchMeta}>
                      <span>{new Date(match.date).toLocaleDateString("fr-FR")}</span>
                      {match.time ? <span> • {match.time}</span> : null}
                      {match.competitionName ? <span> • {match.competitionName}</span> : null}
                    </div>
                  </div>
                  {match.homeScore !== undefined && match.awayScore !== undefined ? (
                    <div className={styles.score}>
                      {match.homeScore} - {match.awayScore}
                    </div>
                  ) : (
                    <span className={styles.badge}>à venir</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
