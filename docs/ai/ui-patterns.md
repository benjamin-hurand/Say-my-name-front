# Design system implicite (SayMyName UI)

## Typo
- `Titillium Web` (CssBaseline), fallback Roboto/Helvetica/Arial.
- Base 16px, poids 400; titres plus denses, lisibilité prioritaire (usage quotidien).

## Couleurs
- Light/Dark via `ThemeColorContext`.
- Accent dynamique via CSS var `--theme-color`.
- Les composants MUI utilisent `color="accent"` (Buttons/Chips/TextFields).
- Fond body : #f5f5dc (light) ou #242424 (dark).

## Surfaces
- Glassmorphism léger (backdrop-filter 6–12px) sur cards, boutons, inputs.
- Radius 12–16.
- Ombres discrètes; accent glow ponctuel (top ranks / CTA).

## Spacing & Layout
- Grille 8px; paddings 16–24.
- Shell `Layout` : Header + content + Footer.
- Header sticky avec logique “back”.
- Footer dock : centré (max width ~400px), actions globales (org switch, thème, langue, settings, home/logout).

## Iconographie
- MUI Icons (ArrowBack, Settings, Business, Language, Logout, etc.) + héritage de couleur accent.

---

# Patterns récurrents (UX)

## Navigation
- `Layout` : pages standard (headerTitle, onBack).
- `WithOrgLayout` / routes protégées : auth/org/role.
- Back logic : historique → previous route → fallback `/`.

## Feedback
- Toasts (react-toastify) pour actions globales (save/reset/login/join).
- Alerts inline pour erreurs de formulaires / informations contextualisées.
- Règle recommandée :
  - Form / validation = inline
  - Action globale / async = toast (+ loader visible)

## Loading / skeleton
- `SkeletonBlock` / placeholders avec délai min (éviter flash).
- Toujours un empty state explicite + CTA.

## Listes / Cards
- `CourseQuickStart` : CTA principal + progression.
- `SectionCard` : titre + sous-texte + actions à droite; surface glass.
- `FilterBar` : search + chips + badge counts + reset; réutilisable.

---

# Leaderboard (V1) — Patterns à standardiser

## Objectif produit
- Offrir un comparatif motivant sans complexité.
- Un **score monotone** (ne diminue jamais) comme métrique primaire.
- Afficher le score partout de la même façon (format, label, hiérarchie).

## Primitives
- `LeaderboardMiniCard` (Menu)
  - Affiche : “Your rank”, score, mini tip “Train to gain points”, CTA “View leaderboard”.
  - States : loading skeleton / empty (no activity) / error (retry).

- `LeaderboardPodium`
  - Top 3 : avatars, noms, scores; #1 plus grand; glow accent léger.
  - State : si <3 users, layout adaptatif sans casser la symétrie.

- `RankRow`
  - Colonnes : rank, avatar, name, score (mono), (optionnel) delta/trend.
  - “You row” highlight (background plus clair + border accent).

- `ScoreChip`
  - Une seule info primaire : le score.
  - Le breakdown (ex: “correct answers”, “sessions”) est secondaire (tooltip / drawer).

## Écrans
- `LeaderboardPage`
  - Header + timeframe (optionnel V1 all-time)
  - “Your Rank” card
  - Podium top 3
  - Liste complète avec search
  - “How it works” card (règles score simples)
  - Empty state : CTA “Start training”

## Ton visuel
- Compétitif mais sobre.
- Accent neon sur top ranks; le reste data-centric et lisible.
- Éviter trop de couleurs; garder le focus sur 1–2 surfaces fortes.

---

# Filtres & tri — harmonisation
- Construire un composant `FilterBar` configurable :
  - Search input
  - Chips (active filters)
  - Buttons: Filters / Sort / Reset
  - Badge counts
- Réutiliser ce pattern sur :
  - Trombinoscope
  - Admin Change Requests
  - Leaderboard (search + chips simples)
  - Quiz options (version “config”, pas “runtime”)

---

# Quiz — cohérence Training / Course
- `QuizHeader` standard :
  - back + title + progress (x/y)
  - (optionnel) timer (plus tard)
  - point d’entrée help/options
- `QuizDisplay` :
  - photo/initiales + flip help
  - input réponse
  - résultats (result mode)
  - CTA primaires/secondaires cohérents

---

# Dette UX probable (après suppression challenges)
- Certains libellés/CTA/props legacy peuvent rester (ex: “Create challenge”, “fromChallenge”).
- Cohérence à renforcer :
  - reset confirmations unifiées
  - règles toast vs alert
  - hiérarchie CTA (1 primaire/section)

---

# Recommandations structurelles (primitives à standardiser en priorité)
1) `Button` variants (primary/secondary/danger) + focus styles cohérents.
2) `SectionCard` standard (header/actions/states).
3) `FilterBar` standard.
4) `ConfirmDialog` harmonisé (checklist + type RESET optionnel).
5) `SkeletonBlock` + empty states systématiques.
6) `Leaderboard` primitives (MiniCard/Podium/RankRow/ScoreChip).
