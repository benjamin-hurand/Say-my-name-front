# Design system implicite (SayMyName UI)

## Typo
- `Titillium Web` (CssBaseline), fallback sans-serif.
- Base 16px, poids 400; titres denses pour lisibilite quotidienne.

## Couleurs
- Light/Dark via `ThemeColorContext`.
- Accent dynamique stockee en CSS var `--theme-color`; variants accent pour Buttons/Chips/TextFields.
- Fond body : #f5f5dc (light) ou #242424 (dark) depuis `theme.ts`.

## Surfaces
- Cards/boutons/inputs avec blur leger (6–12px), radius ~16.
- Ombres discretes; glow accent ponctuel (menu/CTA).
- Containers frequents `Container maxWidth="sm"` pour les pages hub (leaderboard, XP, profile).

## Spacing & Layout
- Grille 8px; paddings 16–24.
- `Layout` : Header optionnel + content + Footer dock; content flex/scroll interne.
- Footer dock centree (~400px) avec actions globales; back logic dans Header (onBack string).

## Iconographie
- MUI Icons (Settings, Business, Language, Logout, EmojiEvents, Bolt, etc.), couleur accent via theme.

---

# Patterns recurrents (UX)

## Navigation
- `Layout` pour toutes les pages internes; `WithOrgLayout` injecte data annuaire/modes; `ProtectedRoute` / `OrgProtectedRoute` / `RoleProtectedRoute` pour guards.
- Footer : org switch hub + join-by-code dialog, theme toggle, langue, settings, home/logout.
- Back : onBack fourni dans Layout (string) sinon historique browser.

## Feedback
- Toasts (react-toastify) pour actions globales (save/reset/signin/join).
- Alerts inline pour erreurs de formulaire ou etats error/empty (leaderboard, trombi, profile).
- Rappel : validation → inline; actions async globales → toast + loader visible.

## Loading / skeleton
- Skeletons sur leaderboard, XP, profile (avatar), courses stats; spinner avec delai min dans trombi.
- Empty states explicites + CTA (leaderboard "Aucun score", XP "Aucun gain", courses hub, trombi selection).

## Listes / Cards
- `CourseQuickStart` : CTA principal + progression + menu reset.
- `SectionCard` / blocs parametres (settings).
- `Trombi*` : grid/table, filtres/sorts sticky, selection toolbar, peek dialog/drawer, infinite scroll sentinel ou pagination.
- Hub XP/Leaderboard : cartes sombres avec blur + chips (rank/XP/date), listes denses (ListItem + Chip).

---

# XP / Leaderboard actuels
- Leaderboard V1 : carte header avec rank/XP + refresh, badges XP/historique; Top 50 liste (rank/avatar/nom/XP/dernier gain), CTA profil. Etats : skeleton, empty, erreur.
- XP Hub : resume XP/niveau/rang + progress bar, dernier gain, CTA voir classement; historique groupe par jour avec icones event et delta XP; bouton "Charger plus" + retry.
- Absents aujourd'hui : search, filtres (suivis), timeframe; podium/mini-card legacy non utilises.
- A harmoniser : ScoreChip/RankRow/podium si on reintroduit des variantes, et partage de composants entre leaderboard et hub XP (chips, boutons refresh/charger plus).

---

# Filtres & tri
- Pattern complet dans Trombinoscope : barre outils + chips actifs, filtres et tri sticky (ouvrables/fermetures auto au scroll), badge counts, toggle selection; bulk actions follow/unfollow.
- Quiz options : version config (mode, filtres, tri, population, repetition, helps) avec confirmation reset.
- Leaderboard/XP : aucun filtre/tri; si besoins futurs, reutiliser FilterBar-lite (search + chips + reset).
- Admin CRs : search/sort + tabs; aligner badge compte et reset avec FilterBar standard.

---

# Quiz – coherence Training / Course
- `QuizHeader` implicite via Layout (title/back); `QuizDisplay` partage reponses/photo/help/resultats pour Training et Progression.
- Helps : initialGiven/typosFriendly; repetition patterns ajustent la queue.
- Etats : loading initial, no questions (toast + CTA options), result mode, review session (reviewList) avec snapshot options dans `QuizSessionContext`.

---

# Dette UX probable
- Leaderboard/XP : manque de search/filtres/timeframe, pas de breakdown score; composants podium/mini-card legacy non aligns avec l'UI actuelle.
- Profile : CTAs vers `/profile/create` et `/profile/pick` sans routes definies; risque de navigation 404.
- Training review : `goBackFromReview` pointe `/menu` (route absente, fallback via redirect).
- Join-by-code (footer/onboarding) encore stub cote back.
- StartCourse : redirection sur `/course/{id}/continue` non declaree dans le router (potentiel 404).
- Harmonisation manquante des confirmations reset (courses, options) et des regles toast vs alert selon ecran.

---

# Recommandations structurelles (priorite)
1) Standardiser primitives leaderboard/XP (ScoreChip/RankRow/Podium/mini card) et ajouter au moins search ou filtre suivi si besoin.
2) Clarifier routes manquantes (`/profile/create|pick`, `/course/{id}/continue`, `/menu`) ou ajuster les CTAs pour pointer vers des routes existantes.
3) Factoriser un `FilterBar` reutilisable (trombi/admin/leaderboard futur) + focus styles coherents.
4) Unifier confirmations reset (courses/options) et etats loading/empty/erreur documentes par ecran.
5) Garder `CourseQuickStart` / `SectionCard` et patterns cards blur/glass comme references visuelles pour de nouveaux ecrans.
