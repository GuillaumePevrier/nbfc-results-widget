# nbfc-results-widget

Widget Next.js 14 (App Router + TypeScript) pour afficher les résultats et prochains matchs d'un club de foot via l'API DOFA de la FFF. Le widget est prévu pour une intégration en iframe (sans code WordPress spécifique) et n'utilise **aucune donnée mockée**.

## Démarrage

```bash
npm install
npm run dev
```

- Widget : `http://localhost:3000/widget?club=24824`
- Proxy DOFA (résultats) : `http://localhost:3000/api/dofa/club/24824/resultat`
- Proxy DOFA (calendrier) : `http://localhost:3000/api/dofa/club/24824/calendrier`
- Proxy DOFA (équipes) : `http://localhost:3000/api/dofa/club/24824/equipes`
- Route interne simplifiée :
  - Résultats : `http://localhost:3000/api/club/{clubId}/results?competitionId=<cp_no>`
  - Équipes : `http://localhost:3000/api/club/{clubId}/teams`

## Fonctionnement
- Toutes les données proviennent de l'API DOFA réelle (headers dédiés, pas de mock, cache 5 minutes côté proxy).
- Le club par défaut est **cl_no = 24824** (NOYAL BRECE FC). Si un numéro d'affiliation est passé (ex: 547517) ou qu'un ID renvoie 404, l'appli tente automatiquement de récupérer le `cl_no` réel via `/api/dofa/club/{id}`.
- La page `/widget` ne fait que des appels serveur vers les routes internes ; aucun appel client direct à DOFA.
- Sélection d'équipe via un dropdown (basé sur les données de `/equipes`) qui filtre les matchs par compétition (`cp_no`).
- États gérés : skeleton (loading), vide (`Aucun match disponible`), erreur (`Données indisponibles` + statut HTTP).

## Structure
- `app/api/dofa/club/[clubId]/*` : proxy DOFA (résultats, calendrier, équipes, info club) avec headers dédiés et propagation des statuts HTTP.
- `app/api/club/[clubId]/results` : retourne un payload simplifié (dernier match, prochain match, ranking si dispo) sans fallback fictif.
- `app/api/club/[clubId]/teams` : expose les équipes du club et l'équipe par défaut.
- `app/widget/page.tsx` : page serveur qui charge club, équipes et résultats, applique le filtre compétition et affiche les états (erreur/vide).
- `components/*` : Widget, MatchCard, RankingCard et styles (`widget.module.css`).
- `lib/dofa.ts` : normalisation des matchs/équipes, sélection des matchs (dernier/prochain) et helpers génériques.

## URLs de test en production
- Widget : `/widget?club=24824`
- Résultats proxy : `/api/dofa/club/24824/resultat`
- Calendrier proxy : `/api/dofa/club/24824/calendrier`
- Équipes proxy : `/api/dofa/club/24824/equipes`

Si une équipe/compétition n'a aucun match (passé ou à venir), la réponse reste en HTTP 200 avec le message `Aucun match disponible` affiché dans le widget.
