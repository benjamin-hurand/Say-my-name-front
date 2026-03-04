# SayMyName – Figma Prompts V4 (XP/Leaderboard V1, no challenges)

## How to use
1) Copier **le bloc "Design Contract" + le prompt de l'ecran** dans Figma AI / Make.
2) Garder le format bullet pour la stabilite.
3) Priorite P0 : **Menu → Training Quiz → Leaderboard → XP Hub → Trombinoscope → Settings → Courses Hub**, puis aligner les autres.
4) Apres une premiere generation, demander : "create variants for loading/empty/error states" et "create a compact mobile variant".

---

## Design Contract (prefexer avant chaque prompt d'ecran)
- Product: SayMyName, learning quiz web app (React + TypeScript + MUI). Output implementable avec composants MUI.
- Layout: desktop-first, content max 1040px; hubs (leaderboard/XP/profile) souvent maxWidth=sm. Auth forms max 420px.
- Grid/spacing: grille 8px; paddings 16/24; pas d'espacement aleatoire.
- Surfaces: cards/dialogs glass leger; radius 12–16; ombres discretes.
- Typo: hierarchie claire (H1 titre page, H2 titres section, body, caption); lisibilite quotidienne prioritaire.
- CTA: une action primaire par section; secondaires en outlined/text; danger separe + confirmation.
- States: chaque ecran inclut loading, empty, error (aucune erreur silencieuse).
- Gamification: leaderboard V1 = score XP monotone, top 50, pas de timeframe; hub XP affiche niveau/progression + historique.
- Primitives a reutiliser: FilterBar (search+chips+filters+sort+reset), SectionCard, ConfirmDialog, StatusChip, SkeletonBlock, InlineAlert + Toast, QuizHeader, RankRow/ScoreChip (si leaderboard), SelectionToolbar (trombi), CourseQuickStart.

---

# Screens

## Screen: Sign In (desktop-first)
- Goal: connexion email/password ou Google; informer si invitation en attente.
- Layout: panneau centre (max 420px); avatar verrou + titre "Log in"; Alert info invitation optionnelle; form email + password (toggle); CTA primaire "Sign In"; divider "or"; bouton Google full width; liens "Forgot password?" et "Sign up".
- Components: ContentCard, InlineAlert, TextFields, Button primary, Google button, FooterAuth liens.
- States: normal, submit loading, erreur (alert), info invitation.

## Screen: Sign Up (desktop-first)
- Goal: creer un compte (display name/email/password) ou Google; validations inline.
- Layout: panneau centre; bouton Google puis divider; formulaire; checklist force MDP; CTA "Create account"; lien "Sign in"; Alert invitation optionnelle.
- Components: ContentCard, InlineAlert, TextFields + helper icons, Divider, Button primary, Google button.
- States: validation champ, submitting, erreur globale, info invitation.

## Screen: Onboarding (desktop-first)
- Goal: guider l'utilisateur sans organisation pour creer ou rejoindre via code.
- Layout: plein hauteur centre; logo; titre + description; deux CTAs ("Creer une organisation" primaire, "Rejoindre avec un code" secondaire); texte aide; modal join-by-code.
- Components: Logo, Buttons, Dialog code (TextField + CTA), Toasts.
- States: dialog open/close, join loading, success/error toasts.

## Screen: Invitation Preview
- Goal: afficher une invitation d'organisation et permettre d'accepter.
- Layout: carte centree avec logo/nom orga, infos role/inviteur, actions "Accepter" primaire + "Refuser/Retour" secondaire, texte legal.
- Components: ContentCard, Typography, Buttons, InlineAlert pour warning token.
- States: loading token, erreur/expired, succes (toast + redirect), pending submit.

## Screen: Verify Email (OTP)
- Goal: saisir le code OTP pour verifier l'email.
- Layout: carte centre (max 420px) avec titre, champ code (6 digits), CTA "Verifier", lien renvoyer le code.
- Components: ContentCard, TextField/OTP inputs, Button primary, Text link, InlineAlert erreur.
- States: submitting, erreur code invalide/expire, succes (toast/redirect), resend etat disable/feedback.

## Screen: Forgot Password
- Goal: envoyer un lien de reinitialisation par email.
- Layout: carte centre, champ email, CTA "Send reset link", texte aide/retour login.
- Components: ContentCard, TextField email, Button primary, Text links, InlineAlert info/erreur.
- States: submitting, succes (info alert/toast), erreur (alert).

## Screen: Reset Password
- Goal: redefinir le mot de passe via token.
- Layout: carte centre, champs nouveau mot de passe + confirmation, checklist force MDP, CTA "Reset password".
- Components: ContentCard, Password TextFields, Checklist, Button primary, InlineAlert pour token invalide.
- States: loading token, erreur token/validation, submitting, succes (toast/redirect).

---

## Screen (P0): Menu (desktop-first)
- Goal: hub principal (training, trombinoscope, parcours, profil/leaderboard/settings, admin).
- Layout: colonne centree scrollable; logo top; sections stack:
  - "Parcours" : CourseQuickStart + bouton "Tous mes parcours"
  - "Apprentissage" : boutons Training / Trombinoscope
  - "Mon compte" : boutons Profile / Leaderboard / Settings
  - "Administration" conditionnelle
- Components: CourseQuickStart, Buttons outlined/contained, Section titles (overline), Footer dock visible.
- States: cours loading (skeleton dans CourseQuickStart), pas de cours (CTA creer), aucune org → remplacer le contenu par l'onboarding simplifie.

## Screen: Menu (mobile-first variant)
- Goal: meme hub optimisé mobile (tap targets larges).
- Layout: sections empilees, boutons pleine largeur; CourseQuickStart compact; Footer dock fixe.
- Components: identiques, espacements mobiles.
- States: idem desktop.

---

## Screen (P0): Settings
- Goal: preferences (theme, langue, particules, SRS, courses, privacy/help).
- Layout: colonne max 1040px; lien toggle "options avancees"; sections/carte repliables denses:
  - QuickSettings (theme toggle, langue, accent)
  - Appearance (palette/accent mode)
  - Courses (liste + progression + menu reset)
  - Background particles (switch + sliders) [advanced]
  - SRS (algo + sliders) [advanced]
  - Language, Privacy/Help
- Components: SectionCard, Switch/Select/Chips/Slider, ConfirmDialog reset, SkeletonBlock, InlineAlert info si pas d'org.
- States: loading/saving par section, empty courses, confirm dialogs, info alert si org manquante.

---

## Screen (P0): Training Quiz
- Goal: entrainement libre pour memoriser personnes/attributs avec helps/SRS.
- Layout: QuizHeader (title/back + progress optionnel); ContentCard centrale avec photo/initiales, input reponse, bouton aide (attributs), feedback resultat; barre d'actions primaire/secondaire.
- Components: QuizHeader, ContentCard, Avatar/photo, TextField, Buttons (Validate/Next, Options, Replay), StatusChip/InlineAlert pour aide/resultats.
- States: loading skeleton, empty/no questions (CTA options), result mode (correct/incorrect + valeurs), help-used state, warning options critiques.

## Screen: Quiz Options
- Goal: configurer mode/filtres/tri/population/repetition/helps avant training.
- Layout: max 1040px; sections: Mode selection (cards), Filters (chips + bouton "Edit filters"), Sort (draggable list), Population scope (radio/chips), Repetition pattern (cards + slider), Helps toggles; footer actions Cancel/Save; ConfirmDialog pour reset/changements critiques.
- Components: SectionCard, ModeCard, Filter chips/dialog, Draggable list, Slider, Switch, ConfirmDialog, Toast.
- States: modal edit ouverte, warning critical changes, saving/loading.

## Screen: Progression Quiz (Course)
- Goal: faire avancer le parcours courant avec la file guidee du cours.
- Layout: QuizHeader (title "Course", back optional), ContentCard avec photo/initiales, input reponse, aide attributs, feedback resultat; barre d'actions Next/Retry; footer ou hint sur batch/course.
- Components: QuizHeader, ContentCard, Avatar/photo, TextField, Buttons (Validate/Next/Retry), InlineAlert pour fin de batch/erreur, StatusChip progression.
- States: loading initial (course/session), batch vide (CTA retry/free training), result mode, error fetch, saving progression (optionnel).

---

## Screen (P0): Leaderboard (desktop-first)
- Goal: afficher le classement XP org (top 50) et encourager le training.
- Layout: container maxWidth=sm; carte header (titre, sous-texte, date maj), Chip rang/XP + bouton refresh; chips XP + historique; carte Top 50 (titre + loader) puis liste (RankRow: rank/avatar/nom/score + chip XP + date dernier gain); CTA "Voir mon profil".
- Components: SectionCard, Chip (EmojiEvents/Bolt/History), IconButton refresh, List + ListItemAvatar/Text, InlineAlert pour erreur.
- States: loading skeleton list, empty "Aucun score", erreur avec retry refresh, highlight "me" row.

## Screen: Leaderboard (mobile-first variant)
- Goal: meme contenu sur mobile.
- Layout: stack verticale, boutons compact, liste scrollable; chips et bouton refresh accessibles.
- Components/States: identiques.

---

## Screen (P0): XP Hub
- Goal: afficher XP total/niveau/rang et historique detaille des gains.
- Layout: container maxWidth=sm; carte resume (titre, sous-texte, Chip rang, Chips XP/niveau, progress bar vers prochain niveau, dernier gain, CTA "Voir le classement"); carte Historique (titre + sous-texte + date maj), liste groupee par jour (sous-titres date + lignes event avec icone, titre, sous-texte, Chip delta XP); bouton "Charger plus" + retry.
- Components: Cards glass, Chips (EmojiEvents/Bolt/History/MilitaryTech), LinearProgress, List/Stack, Buttons outlined.
- States: loading skeleton (liste de lignes), empty (aucun gain), erreur (Alert) + bouton retry, load-more disabled en fin.

---

## Screen (P0): Trombinoscope (desktop-first)
- Goal: parcourir l'annuaire, filtrer/trier, suivre/unsuivre, selection bulk; peek fiche.
- Layout: barre outils sticky (search + clear, chip suivis, toggle grid/table, page size, boutons Filters/Sort avec badges, selection toggle, count); zone scrollable avec filtres/tri sticky; vue grid ou table; peek drawer/dialog; pagination ou infinite scroll avec sentinel; selection toolbar pour bulk follow/unfollow.
- Components: FilterBar (search + chips), ToggleButtonGroup, Select page size, Buttons Filters/Sort, Badges, TrombinoscopeGrid/Table, PersonPeekDrawer/Dialog, SelectionToolbar, Snackbar + Alert, Pagination.
- States: loading avec delai min (spinner + texte), empty vs error banner, selection mode on/off (hint), infinite scroll loader, admin mode (hide follow).

## Screen: Trombinoscope (mobile-first variant)
- Goal: meme fonctions en mobile.
- Layout: search pleine largeur; controls wrap; vue grid 1 colonne par defaut; peek drawer pleine hauteur; selection toolbar sticky bas.
- Components/States: idem desktop (touch-friendly).

---

## Screen: Courses Hub
- Goal: gerer les parcours par mode, continuer ou reset.
- Layout: header + action "Gerer mes suivis"; stack de `CourseQuickStart` par mode avec progression; menu kebab reset; dialog confirmation avec checkbox + "RESET".
- Components: CourseQuickStart, Buttons, ConfirmDialog, SkeletonBlock, Toast.
- States: loading stats, empty (aucun cours), reset en cours (CTA disable).

## Screen: Start Course
- Goal: demarrer un parcours base sur les personnes suivies.
- Layout: colonne scrollable; texte intro; Card "Population" (chips suivis + compte + preview avatars, hint, bouton "Gerer mes suivis"); Card "Mode d'entrainement" (chips modes); CTA primaire "Demarrer le parcours".
- Components: Cards with headers/icons, Chips (selection), Alert info si aucun suivi, Tooltip/InlineHint, Button primary.
- States: loading preview suivis, disable CTA si aucun suivi, erreur submit (toast), success toast.

---

## Screen: Admin Change Requests
- Goal: traiter les demandes de changement avec search/sort/tabs et review modal.
- Layout: header (titre + count chip + search + sort + refresh + last updated); tabs Pending/History; table avec header sticky (Person, Attribute, Proposed values, Reason, Requester, Created, Status [+ resolved by en history]); pagination; review dialog (approve/reject + comment); person peek optionnel.
- Components: Tabs, Table, StatusChips, FilterBar-lite (search/sort/reset), Review Dialog, SkeletonBlock, InlineAlert, Toast.
- States: loading skeleton min, empty (no CR / no results), error banner, partiel possible sur approvals.

## Screen: Admin Home
- Goal: tableau de bord admin (KPIs, change requests, membres/invitations).
- Layout: cards KPI (persons, attributes), bloc change requests (liste courte + lien), cartes liens rapides (membres/invitations, attributes, trombi admin).
- Components: SectionCard/ContentCard, Statistic tiles, Buttons/Links, InlineAlert pour erreurs de fetch.
- States: loading skeleton cards, empty (data 0), erreur fetch (alert).

## Screen: Admin Persons (Admin trombinoscope)
- Goal: parcourir/editer les personnes cote admin (sans follow).
- Layout: meme base trombi mais `hideFollowFeatures`; barre outils (search, view grid/table, filters/sorts), vue grid/table, peek dialog admin, edit dialog, pagination/infinite scroll.
- Components: FilterBar, TrombinoscopeGrid/Table, AdminPersonPeekDialog, AdminPersonEditDialog, SelectionToolbar (sans follow), Snackbar/Alert.
- States: loading (spinner/skeleton), empty, erreur, edit saving, deep-link peek via route id.

## Screen: Admin Attributes
- Goal: gerer les attributs (liste, creation, edition).
- Layout: table/list des attributs avec colonnes nom/type/ordre/usage, bouton "Add attribute", actions edit/delete, dialog d'edition/creation.
- Components: SectionCard/Table, Buttons, Dialog (form fields), ConfirmDialog pour suppression, InlineAlert/Toast.
- States: loading skeleton table, empty (aucun attribut), erreur fetch/save, saving state sur dialog.

## Screen: Admin Members
- Goal: gerer membres/invitations de l'organisation.
- Layout: onglets ou liste combinee pour membres et invitations; search; actions (changer role, activer/desactiver, renvoyer invitation); bouton "Inviter".
- Components: Tabs (Members/Invites) si besoin, Table/List, StatusChip, Buttons, Dialog invitation, ConfirmDialog pour remove, InlineAlert/Toast.
- States: loading, empty (pas d'invitations/membres), erreur fetch, saving/removing in progress.***
