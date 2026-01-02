# nbfc-results-widget

Widget Next.js 14 (App Router + TypeScript) pour afficher les résultats et prochains matchs d'un club de foot via l'API DOFA de la FFF. Le widget est prévu pour une intégration en iframe (sans code WordPress spécifique) et n'utilise **aucune donnée mockée**.

## Démarrage

```bash
npm install
npm run dev
```

### URLs de test locales
- Widget : `http://localhost:3000/widget?club=24824`
- Proxy DOFA résultats (filtre cp_no optionnel) : `http://localhost:3000/api/dofa/results?clNo=24824&cpNo=<cp_no>`
- Proxy DOFA équipes : `http://localhost:3000/api/dofa/teams?clNo=24824`
- Proxy info club : `http://localhost:3000/api/dofa/club/24824`
- Proxy calendrier brut (utilisé pour les matchs à venir) : `http://localhost:3000/api/dofa/club/24824/calendrier`

## Fonctionnement
- Toutes les données proviennent de l'API DOFA réelle (headers dédiés, pas de mock).
- Le club par défaut est **cl_no = 24824** (NOYAL BRECE FC). Si un numéro d'affiliation est passé ou si l'ID renvoie 404, la page tente automatiquement de récupérer le `cl_no` via `/api/dofa/club/{id}`.
- La page `/widget` ne fait que des appels serveur vers les routes internes ; aucun appel client direct à DOFA.
- Sélection d'équipe via un dropdown (données `/api/dofa/teams`) : l'équipe choisie applique le premier `cp_no` disponible pour filtrer les résultats.
- États gérés : loading, vide (`Aucun match disponible`), erreur (`Données indisponibles` + statut HTTP).

## Structure
- `app/api/dofa/results` : proxy DOFA pour les résultats, avec gestion d'erreur claire, timeout et cache 60s.
- `app/api/dofa/teams` : proxy DOFA pour les équipes (liste simplifiée, compétitions incluses).
- `app/api/dofa/club/[clubId]/*` : proxies bruts (info club, calendrier, etc.).
- `app/widget/page.tsx` : page serveur qui résout le club, charge équipes + résultats réels, applique le filtre compétition et affiche les états (erreur/vide).
- `components/*` : Widget, MatchCard, RankingCard et styles (`widget.module.css`).
- `lib/dofa.ts` : normalisation des matchs/équipes, sélection des matchs (dernier/prochain) et helpers génériques.

## URLs de test (production)
- Widget : `/widget?club=24824`
- Résultats proxy : `/api/dofa/results?clNo=24824`
- Équipes proxy : `/api/dofa/teams?clNo=24824`
- Calendrier proxy : `/api/dofa/club/24824/calendrier`

Si aucune rencontre n'est disponible, le widget affiche `Aucun match disponible` en HTTP 200 (pas de données fictives).
