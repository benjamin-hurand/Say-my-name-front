# Product
- SayMyName est une app de mémorisation de personnes dans une organisation : authentification (email / Google), onboarding par organisation, trombinoscope + suivi (follow/unfollow), quiz d’entraînement (SRS), parcours guidés (courses), leaderboard de progression (V1), et un back-office admin (personnes, attributs, demandes de changement, invitations).
- L’objectif V1 de la “compétition” est un **Leaderboard** simple et motivant (score monotone qui ne baisse jamais), au niveau de l’organisation active.
- UI : MUI + accent color dynamique + fond à particules optionnel.

---

# Routes / Pages (react-router-dom)

## Auth & public
- `/signin` → `SignIn`
  - Sections : avatar verrou, inputs email/mot de passe (toggle visibilité), CTA Sign In + Google, liens texte.
  - Actions primaires : login, login Google.
  - États : erreur (Alert), pending invitation info (Alert), succès (toast).
- `/signup` → `SignUp`
  - Sections : CTA Google, séparateur, form display name/email/password, checklist force MDP, CTA submit, lien Sign In.
  - États : validations live/debounce, erreurs globales/champs, success → vérif email.
- `/signup/verify-email`, `/auth/verify-email` → `VerifyEmailPage` (OTP)
- `/forgot-password` → `ForgotPasswordPage`
- `/reset-password` → `ResetPasswordPage`
- `/invitation` ( `/invite` redirect) → `InvitationPreviewPage` : aperçu et acceptation d’invitation orga.

## Onboarding org
- `/onboarding` (auth mais sans org) → `Onboarding`
  - Sections : logo, hero texte, CTAs créer / rejoindre, texte helper; dialog code (input + CTA join).
  - États : join loading, succès/erreur via toasts.

## App (org requise)
- `/` → `Menu` (Layout isMenu)
  - Sections : logo, bloc Parcours (CourseQuickStart + “Tous mes parcours”), bloc Apprentissage (Training, Trombinoscope),
    bloc Progression (Leaderboard), bloc Mon compte (Profile, Settings), bloc Admin conditionnel.
  - États : si aucune org → écran onboarding simplifié; chargement cours courant; chargement rank/score.

- `/training` → `TrainingQuiz` (Layout header "Training", onBack="/")
  - Sections (via `QuizDisplay`) : photo/initiales, champ réponse, aide (attributs), badges, résultat, boutons valider/suivant, lien options, retry.
  - Actions primaires : valider réponse, utiliser help.
  - Secondaires : options (/training/options), recommencer.
  - États : loading initial, no questions (warning), result mode (messages), session snapshot, history/review list (ex: depuis Course free-training).

- `/training/options` → `QuizOptions`
  - Sections : modes (cards), filtres (chips + modal add/edit), tri (drag list), population scope, répétition (patterns + sliders),
    saveProgress, helps toggles, dialog confirmation reset.
  - Actions : Save / Cancel.

- `/leaderboard` → `LeaderboardPage` (Layout header "Leaderboard", onBack="/")
  - Sections : “Your rank” (rang + score), podium Top 3, liste classée (rank rows), (optionnel) recherche/filter suivis.
  - États : loading skeleton, empty (no activity), error + retry.
  - Note V1 : timeframe peut être “All-time” uniquement.

## Settings / Profile
- `/settings` → `SettingsPage` (Layout header "Settings", onBack="/")
  - Sections : QuickSettings, Appearance, Progression/Courses, Background effects (particles), SRS, Language, Privacy/Help.
  - États : SRS saving/loading, Courses skeleton, empty (aucun parcours), confirm dialogs reset.

- `/profile` → `ProfilePage`
  - Sections : avatar/photo (upload), compte (emails), change requests, attributs profil (ou empty state avec CTA créer/choisir profil).
  - États : loading, error, pending change requests.

## Courses
- `/course` → `ProgressionQuiz`
  - Quiz guidé lié au course courant, avec fin de batch et option “Free Training” sur la même population.
  - États : loading, batch épuisé, question courante.

- `/course/hub` → `CoursesHub`
  - Liste des parcours par mode (CourseQuickStart), CTA continuer/créer, reset par cours.
  - États : loading stats, empty, toasts reset.

- `/course/new` → `StartCourse` : création d’un parcours (mode/followed).

## Directory
- `/trombinoscope` et `/trombinoscope/:id` → `TrombinoscopePage`
  - Sections : search, filtre suivis, grid/table, filtres attributs, tri, sélection bulk follow/unfollow, liste, pagination/infinite scroll, peek drawer/dialog.
  - États : loading spinner avec délai, empty/error banner, selection mode.

## Admin (roles viewer/editor/admin/owner)
- `/admin` → `AdminLayout` + `AdminHome` (dashboard)
  - AdminHome : cards KPI (persons/attributes), carte change requests, bouton membres/invitations.
- `/admin/persons/:id?` → `PersonAdminPage` (trombi admin, edit dialog, sans follow)
- `/admin/change-requests/:id?` → `AdminChangeRequestsPage`
  - Table tabs Pending/History, recherche, tri, pagination, skeleton, review dialog, peek personne.
- `/admin/attributes` → `AdminAttributesPage` (gestion attributs)
- `/admin/members` → `AdminMembers` (invitations/membres)

## Fallbacks
- `*` redirige `/`.

---

# Composants réutilisables
- `Layout` + `Header` + `Footer` : shell (back logic, footer dock, org switch hub, theme toggle, langue, settings, logout/home, join-by-code dialog).
- `WithOrgLayout` + `OrgProtectedRoute`/`ProtectedRoute`/`RoleProtectedRoute` : garde auth/org + providers.
- `CourseQuickStart` : carte CTA progression (Menu & CoursesHub).
- `SectionCard`, `AdvancedBlock` : settings sections.
- `ModeCard`, `AttributeCard`, `StyledSlider`, `FilterAndSortBar`, `DraggableSortingMethods`, `AddFilterModal` : patterns de config quiz/tris/filtres.
- `QuizDisplay` : affiche photo/initiales, aide, input réponse, badges, résultats, boutons (Training/Progression).
- `LeaderboardPodium`, `RankRow`, `LeaderboardMiniCard` : modules leaderboard (Menu + LeaderboardPage).
- `TrombiGrid`/`TrombiTable`/`TrombiFilters`/`TrombiSorts`/`SelectionToolbar`/`PersonPeekDialog|Drawer` : annuaire.
- `AdminChangeRequestReviewDialog`, `AdminPersonPeekDialog`, `AdminPersonEditDialog` : modales admin.
- `ParticlesBackground` + `ParticlesContext` : effet visuel optionnel global.

---

# Contexts / State management
- `AuthContext` : session, organisations, activeOrganization, login/logout, switchOrganization, refreshSession, isBooting.
- `ProfileContext` : user/person profile, change requests, refreshProfile.
- `OrgDataContext` : attributes, filters/sorts, game modes, loading; dépend org active.
- `QuizOptionsContext` : options entraînement (population scope, mode, filters, sorts, repetition pattern, helps, critical changes).
- `QuizSessionContext` : quizList, history, reviewList, sessionOptions snapshot, uncheckedNewSession flag, resetSession.
- `CoursesContext` : selectedCourse, cache courses, createOrResume/focus, refresh/list.
- `CourseStatsContext` : stats cache par course, progress %, refresh/prefetch/invalidate.
- `PersonsDirectoryContext` : pagination annuaire, cache, follow/unfollow, search/goto, followedIds, loading/error.
- `LeaderboardContext` (V1 à créer) :
  - myRank, myScore, top3, rows, loading/error, refresh()
  - scope = org active, timeframe = all-time (V1)
- `AdminDataContext`, `AdminCRCacheContext` : admin KPIs + cache CR.
- `ThemeColorContext` : thème, accent, accent mode, CSS var injection.
- `ParticlesContext` : settings particules (enabled/count/speed/frozen), persistance.

---

# Flux utilisateurs clés

## Onboarding / rejoindre ou créer orga
1) Connexion → si aucune org, redirection `/onboarding`.
2) CTA “Créer groupe” → flow de création (Settings/Admin selon ton choix).
3) CTA “Rejoindre” ouvre dialog code (aussi via footer org hub join).
4) Après join/création, activeOrganization alimente OrgData → accès menu/quiz/leaderboard.

## Leaderboard (V1)
1) Menu affiche “Your rank / score” (mini card).
2) CTA “View leaderboard” → `/leaderboard`.
3) Leaderboard page : Top 3 + liste complète + “Start training” si empty.
4) Le score augmente au fil des réponses (et idéalement des actions utiles : follow, sessions, etc. si tu veux).

## Entraînement libre / options
1) Depuis menu, `/training` charge quizList selon options (QuizOptionsContext/OrgData).
2) Help révèle attributs; validation applique SRS; saveProgress si activé.
3) Bouton Options → `/training/options` : changer mode/filters/tri/répétition; confirmation si reset.

## Parcours guidé (Course)
1) Menu charge course courant (stats).
2) `/course` lance quiz course.
3) Batch épuisé : “Continuer 10 nouveaux” ou “Free Training” sur la même population.
4) `/course/hub` gère tous les parcours, resets.

## Admin
1) Accès via menu si rôle.
2) Dashboard (KPIs, CR pending).
3) Change Requests : review approve/reject.
4) Persons admin : édition d’attributs.

---

# Hypothèses / incertitudes
- Création d’organisation et join via code peuvent être partiellement stub (selon ton backend actuel).
- Leaderboard V1 : all-time only, org-scoped only, score monotone.
- Certaines pages (AdminAttributesPage/AdminMembers/StartCourse) non décrites finement.
