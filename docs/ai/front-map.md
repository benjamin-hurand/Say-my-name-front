# Product
- SayMyName est une app de memorisation de personnes dans une organisation : auth (email / Google), onboarding par organisation, trombinoscope (follow/unfollow + bulk), quiz d'entrainement libre, parcours guides (courses), leaderboard XP (V1) et hub XP personnel, plus un back-office admin.
- Objectif V1 de la competition : un classement XP simple au niveau de l'organisation active (score monotone, top 50).
- UI : MUI + couleur d'accent dynamique (ThemeColorContext), particules optionnelles (ParticlesContext).

---

# Routes / Pages (react-router-dom)

## Auth & public
- `/signin` → `SignIn`
  - Sections : avatar/verrou, email/password (toggle visibilite), CTA Sign In, Google button, liens forgot / signup.
  - Etats : erreur (Alert), invitation detectee (Alert info), submit loading, redirection vers invitation apres login si token.
- `/signup` → `SignUp`
  - Sections : CTA Google, separateur, form display name/email/password (checklist force MDP), CTA submit, lien Sign In.
  - Etats : validations live, erreurs globales/champs, succes → verif email.
- `/signup/verify-email`, `/auth/verify-email` → `VerifyEmailPage` (OTP)
- `/forgot-password` → `ForgotPasswordPage`
- `/reset-password` → `ResetPasswordPage`
- `/invitation` (`/invite` redirect) → `InvitationPreviewPage`

## Onboarding org
- `/onboarding` (auth mais sans org) → `Onboarding`
  - Sections : logo, hero texte, CTA creer / rejoindre, helper text, dialog join-by-code.
  - Etats : join loading, toasts success/erreur. Egalement rendu en fallback dans `Menu` si aucune organisation active.

## App (auth requise)
Providers pour toute la zone auth : `ProfileProvider` + `CourseProvider` + `CourseStatsProvider` (puis guards). Zone org : `OrgProtectedRoute` + `WithOrgLayout` (`OrgDataProvider` + `PersonsDirectoryProvider`).

- `/` → `Menu` (Layout isMenu)
  - Sections : logo centre, bloc Parcours (CourseQuickStart + CTA Tous mes parcours), bloc Apprentissage (Training, Trombinoscope), bloc Mon compte (Profile, Leaderboard, Settings), bloc Admin conditionnel (role VIEWER/EDITOR/ADMIN/OWNER).
  - Etats : chargement cours courant + stats, pas de cours (CTA creer), pas d'organisation → ecran onboarding simplifie.

- `/training` → `TrainingQuiz` (Layout header "Training", onBack="/")
  - Via `QuizSessionProvider` + `QuizOptionsProvider`.
  - Sections (QuizDisplay) : photo/initiales, champ reponse, aide (attributs), badges/resultats, boutons valider/suivant, liens options et retry.
  - Etats : loading initial, no questions (toast + retour options), result mode, history/review mode, warning si options critiques changees.

- `/training/options` → `QuizOptions` (Layout header "Training Options", onBack="/training")
  - Sections : mode cards, filtres (chips + modal edit), tri (liste draggable), population scope, repetition patterns + sliders, toggles helps/saveProgress, dialog confirmation reset.
  - Actions : Save / Cancel. Etats : save/loading, warning critical changes.

- `/leaderboard` → `LeaderboardPage` (Layout header "Classement", onBack="/")
  - Sections : carte titre + chips rang/XP + bouton refresh, badges XP et historique, carte Top 50 avec liste (rank, avatar, nom, XP, dernier gain), CTA "Voir mon profil".
  - Etats : skeleton quand loading initial, empty state "Aucun score", erreur (Alert) + retry refresh. Pas de filtres/search/timeframe V1.

- `/xp` → `XpHubPage` (Layout header "XP", onBack="/leaderboard")
  - Sections : resume XP/niveau/rang (chips), progress bar niveau, dernier gain, CTA voir classement; historique XP groupe par jour (cartes evenements avec icones et delta XP), bouton "Charger plus".
  - Etats : loading skeleton, empty (aucun gain), erreur (Alert) + retry, bouton disable si plus de page.

- `/settings` → `SettingsPage` (Layout header "Settings", onBack="/")
  - Sections : QuickSettings, Appearance, Courses (avec `OrgDataProvider` si org active), Background particles (advanced), SRS (advanced), Language, Privacy/Help. Toggle "options avancees" (localStorage).
  - Etats : courses indispo si pas d'organisation (Alert info + CTA onboarding), loading/saving par section (courses/SRS), confirm dialogs reset.

- `/profile` → `ProfilePage` (Layout header "Profile")
  - Sections : avatar/photo upload, badge XP (`XpProfileBadge`), compte (emails), change requests, attributs profil (ou empty state + CTA creer/choisir profil selon permissions onboarding).
  - Etats : loading via `ProfileContext`, erreur (Alert), refresh auto si CR en attente, onboarding locked si aucune action permise.

## Courses
- `/course` → `ProgressionQuiz` (Layout header "Course", partage `QuizSessionProvider`)
  - Quiz guide pour le cours courant. Etats : loading, batch vide, result mode, retry, focus course avant navigation.
- `/course/hub` → `CoursesHub` (Layout header "Mes parcours", onBack="/")
  - Liste des parcours par mode via `CourseQuickStart` + stats. Menu reset par cours (confirm dialog avec RESET). CTA "Gerer mes suivis" vers trombinoscope.
  - Etats : loading stats par cours, empty si aucun cours, reset en cours.
- `/course/new` → `StartCourse` (Layout header "Start Course", onBack="/course/hub")
  - Creation d'un parcours base sur les suivis (FOLLOWED only), selection mode via chips, preview des suivis, CTA demarrer.
  - Etats : loading preview suivis, disable si aucun suivi, erreurs toast.

## Directory
- `/trombinoscope` et `/trombinoscope/:id` → `TrombinoscopePage`
  - Sections : barre outils (search, chip suivis, toggle grid/table, page size, filtres, tri, selection mode), sticky toolbars, vue grid/table, peek drawer/dialog (responsive), pagination ou infinite scroll, selection toolbar (bulk follow/unfollow).
  - Etats : loading avec delai mini, empty/error (Alert banner), selection mode hints, snackbar success/error, deep-link peek via route id.

## Admin (RoleProtected: VIEWER/EDITOR/ADMIN/OWNER)
- `/admin` → `AdminLayout` + `AdminHome` (dashboard KPIs, change requests, membres/invitations).
- `/admin/persons/:id?` → `PersonAdminPage` (trombi admin hideFollowFeatures).
- `/admin/change-requests/:id?` → `AdminChangeRequestsPage` (tabs Pending/History, table, review dialog).
- `/admin/attributes` → `AdminAttributesPage`
- `/admin/members` → `AdminMembers`
- Providers admin : `AdminCRCacheProvider` + `AdminDataLayout` (inclut `OrgDataProvider` + `AdminDataProvider` + `PersonsDirectoryProvider` dataSource admin).

## Fallbacks
- `*` → redirect `/` (zone org) puis fallback auth → `/`.

---

# Composants reutilisables
- `Layout` + `Header` + `Footer` : shell (back logic, footer dock, org switch hub + join-by-code dialog, theme toggle, langue, settings, logout/home). `WithOrgLayout` injecte `OrgDataProvider` + `PersonsDirectoryProvider`.
- `CourseQuickStart` : carte progression/course (Menu, CoursesHub) avec CTA primary + menu reset.
- Quiz : `QuizDisplay` (photo/initiales, input, aide, resultats, boutons), `QuizOptions` primitives (ModeCard, filtres modal, draggable sorts, sliders repetition).
- Trombi/admin : `TrombiGrid`/`TrombiTable`/`TrombiFilters`/`TrombiSorts`/`SelectionToolbar`/`PersonPeekDialog|Drawer`/`AdminPersonPeekDialog|EditDialog`.
- Profil : `PhotoAvatarSection`, `XpProfileBadge`, `AccountSection`, `AttributesSection` + empty/onboarding CTAs.
- Visuel : `ParticlesBackground` via `ParticlesContext`, theme accent via `ThemeColorContext`.

---

# Contexts / State management
- Arbo providers globaux : `GoogleOAuthProvider` → `ThemeColorProvider` → `LocalizationProvider` → `AuthProvider` → `ParticlesProvider` → `Router`.
- `AuthContext` : session/token, organisations + activeTenant, switchTenant, refreshSession, isBooting/isAuthenticated.
- `ProfileContext` : user/person profile, onboarding permissions (create/pick), change requests, XP/rank/lastXpEventAt, refreshProfile, helpers set/add XP.
- `OrgDataContext` : attributes/filters/sorts/modes par organisation, loading.
- `PersonsDirectoryContext` : recherche annuaire (cache, paging, debounce friendly), follow/unfollow, followedIds, loading/error.
- `CourseProvider` : selectedCourse (+localStorage), cache courses, createOrResume, focus, refreshCurrentCourse/refreshUserCourses, resetAll.
- `CourseStatsContext` : cache stats par course (progress%), refresh/prefetch/invalidate, loading/error par id.
- `QuizOptionsContext` : mode/filters/sorts/population/repetition/helps/saveProgress + critical changes flags (training).
- `QuizSessionContext` : quizList/history/reviewList/sessionOptions snapshot, uncheckedNewSession, resetSession (training + progression).
- `AdminDataContext` : KPIs admin + reuse `OrgDataContext`; `AdminCRCacheContext` : cache page change-requests pending (TTL + reserved height).
- `ThemeColorContext` : theme light/dark, accent, accentMode (static/random-hover/cycle); `ParticlesContext` : particules enabled/count/speed/frozen (persistes).

---

# Flux utilisateurs clefs
- Onboarding org : login → si aucune org → `/onboarding` ou fallback `Menu`; CTA creer org (settings) ou rejoindre via code (dialog) ou invitation preview.
- Training libre : menu → `/training`; quiz list charge selon options; help revele attributs; options via `/training/options`; sauvegarde progression optionnelle.
- Parcours guide : menu charge cours courant + stats; `/course` pour jouer; `/course/hub` pour gerer et reset; `/course/new` pour demarrer sur suivis.
- Leaderboard/XP : menu bouton "Leaderboard" → `/leaderboard` (refresh manuel, top 50); details XP et historique via `/xp` (CTA vers leaderboard).
- Trombi : search/filtres/sorts, follow/unfollow, selection bulk, deep link peek; admin partage la base mais sans follow.
- Admin : acces via menu si role; dashboard, CR review, gestion personnes/attributs/invitations.

---

# Hypotheses / incertitudes
- Routes `/profile/create` / `/profile/pick` sont ciblees par les CTAs mais non declarees dans le router actuel (a verifier ou ajouter).
- Leaderboard V1 : pas de filtres ni timeframe, top 50 uniquement (score monotone XP).
- Joindre/creer org : back-end join-by-code encore TODO (dialog placeholders).
