# SayMyName — Figma Prompts V3 (No Challenges / Leaderboard V1)

## How to use
1) Pour chaque écran, copiez **le bloc “Design Contract” + le prompt de l’écran** dans Figma AI / Figma Make.
2) Conservez le format **bullet** (meilleure stabilité).
3) Génération recommandée : faites d’abord les écrans **P0** dans l’ordre :
   **Menu → Training Quiz → Leaderboard → Trombinoscope → Settings**,
   puis alignez les autres sur les mêmes primitives.
4) Après une première génération, demandez :
   - “Create variants for loading/empty/error states”
   - “Create a compact mobile variant”
   - “Extract reusable components into primitives”

---

## Design Contract (à préfixer avant chaque prompt d’écran)
- Product: SayMyName, a learning quiz web app (React + TypeScript + MUI). Output must be implementable with MUI components and theme tokens.
- Layout: desktop-first. Use max content width 1040px for content-heavy screens; auth forms max width 420px.
- Grid/spacing: consistent 8px grid; prefer 16/24 paddings; avoid random spacing.
- Surfaces: light glass effect on cards/dialogs; border radius 12–16; subtle shadows only.
- Typography: clear hierarchy (H1 page title, H2 section titles, body, caption). Optimize readability for frequent daily usage.
- CTA rules: one primary CTA per section; secondary CTAs are outlined/text; destructive actions are clearly separated and require confirmation.
- States: each screen explicitly includes loading, empty, error states. No “silent errors”.
- Gamification rules:
  - Leaderboard uses a monotonic score (never decreases).
  - Score is the main comparable metric; show a subtle breakdown (optional) but keep one primary number.
  - Timeframes (7d / 30d / all-time) can be supported; V1 can be “All-time”.
- Reusable primitives (use consistently across screens):
  - FilterBar (search + chips + Filters + Sort + Reset + counts/badges)
  - ContentCard / SectionCard (standard padding + header + actions)
  - ConfirmDialog (destructive confirmations; optional “type RESET” pattern)
  - StatusChip (consistent status labels)
  - SkeletonBlock (loading placeholders)
  - InlineAlert + Toast (rules: inline for form validation / toast for global action results)
  - QuizHeader (title/back + progress + help entry point)
  - LeaderboardPodium (Top 3 module)
  - RankRow (list item with rank, avatar, name, score, delta/trend)
  - ScoreChip (the single primary score display)

---

# Screens

## Screen: Sign In (desktop-first)
- Goal: let user sign in via email/password or Google; show invitation info if detected.
- Layout:
  - Centered auth panel (max-width 420px)
  - Top icon/avatar + title “Log in”
  - Optional info alert for invitation
  - Form stack: email + password (visibility toggle)
  - Primary CTA “Sign In”
  - Divider “or”
  - Google sign-in full width
  - Bottom links: “Forgot password?” and “Sign up”
- Components: ContentCard, InlineAlert, TextField email/password, Button primary, Google button, FooterAuth links.
- States: normal, loading on submit, error alert, invitation info alert.

## Screen: Sign Up (desktop-first)
- Goal: create account (display name/email/password) or Google; inline validations.
- Layout:
  - Same auth panel (max-width 420px)
  - Google CTA first, divider, then form
  - Password strength/checklist under password
  - Primary CTA “Create account”
  - Link back to “Sign In”
  - Optional invitation info alert
- Components: ContentCard, InlineAlert, TextFields with helperText, validation icons, Divider, Button primary, Google button.
- States: field validation (valid/invalid), submitting, global error, invitation info.

## Screen: Onboarding (desktop-first)
- Goal: guide user without organization to create one or join by code.
- Layout:
  - Full-height centered layout
  - Logo top
  - Title + short description
  - Two CTAs: “Create a group” (primary) and “Join with code” (secondary)
  - Help text
  - Join-by-code modal dialog
- Components: Logo, Buttons, ConfirmDialog/Dialog with code TextField, Toast.
- States: dialog open/close, join loading/disabled, success toast, error toast.

---

## Screen (P0): Menu (desktop-first)
- Goal: main hub to access training, leaderboard, courses, directory, settings, admin (if allowed).
- Layout:
  - Centered column, scrollable
  - Logo/header
  - Sections (SectionCard or grouped blocks):
    - “Courses” (CourseQuickStart + CTA)
    - “Training”
    - “Leaderboard” (top snippet + CTA “View leaderboard”)
    - “Directory” (Trombinoscope)
    - “My account”
    - “Administration” (conditional)
  - Footer dock/persistent navigation
- Components:
  - SectionCard
  - CourseQuickStart (progress + CTA)
  - LeaderboardMiniCard (your rank + your score + CTA)
  - Buttons with icons, StatusChip, FooterDock
- States:
  - course present/absent, loading progress skeleton
  - leaderboard loading / empty (no data yet)
  - no org → redirect/entry to onboarding

## Screen: Menu (mobile-first variant)
- Goal: same hub optimized for mobile with large tap targets.
- Layout:
  - Stacked sections, full-width buttons
  - CourseQuickStart compact
  - LeaderboardMiniCard compact
  - FooterDock fixed
- Components: same primitives; touch-friendly spacing.
- States: same as desktop.

---

## Screen (P0): Settings
- Goal: preferences dashboard (theme, language, particles, SRS, course progress, privacy/help).
- Layout:
  - Max width ~1040px content column
  - SectionCards/accordions:
    - QuickSettings (theme toggle, language, accent chips)
    - Appearance (palette, accent mode)
    - Courses (list with progress + kebab actions + reset)
    - Background effects (switch + sliders)
    - SRS (select algorithm + Save/Reset)
    - Privacy/Help links
- Components: SectionCard, Switch, Select, Chips, Slider, ConfirmDialog (reset), SkeletonBlock, InlineAlert, Toast.
- States: loading skeleton for course stats, empty courses, save in progress, confirm dialogs, info alert if no org.

---

## Screen (P0): Training Quiz
- Goal: free training quiz to memorize people/attributes with helps and SRS.
- Layout:
  - QuizHeader (back + title + progress)
  - Main ContentCard:
    - Photo (or placeholder) + initials badge
    - Answer input
    - Help actions (show attributes / hint)
    - Result feedback (correct/incorrect + correct values)
  - Action row:
    - Primary: “Validate” (before answer) / “Next” (after result)
    - Secondary: “Options”, “Replay”
- Components: QuizHeader, ContentCard, Photo/Avatar, Text input, Buttons, StatusChip, InlineAlert, Toast.
- States: loading skeleton, empty/no questions (CTA to options), result state, help-used state, warning for critical option changes.

---

## Screen: Quiz Options
- Goal: configure mode/filters/sorts/repetition/population before training.
- Layout:
  - Max width ~1040px
  - Sections:
    - Mode selection (ModeCards)
    - Filters (FilterBar-like: chips + “Edit filters”)
    - Sort (draggable list)
    - Population scope (radio/chips)
    - Repetition pattern (cards + slider)
    - Helps toggles
  - Footer actions: Cancel (secondary), Save (primary)
  - ConfirmDialog for “reset progression” / “critical changes”
- Components: SectionCard, ModeCard, Filter chips + dialog, Draggable list, Slider, Switch, ConfirmDialog, Toast.
- States: editing filter modal, critical-change warning, saving/loading.

---

## Screen (P0): Leaderboard (desktop-first)
- Goal: show ranking inside the active organization and motivate progress (single monotonic score).
- Layout:
  - Header: title “Leaderboard” + timeframe selector (optional V1: All-time only) + info tooltip
  - Top module: “Your position” card (rank, score, small tip)
  - Podium module (Top 3): large avatars + names + scores
  - List module: rank rows (4..N), search user, filter “only followed” (optional)
  - Secondary panel (right on desktop): “How scoring works” + “Ways to earn points”
- Components:
  - SectionCard “Your Rank”
  - LeaderboardPodium
  - FilterBar-lite (search + chips)
  - RankRow list (rank, avatar, name, score, small delta/trend)
  - InlineAlert for empty/error
- States:
  - loading skeleton
  - empty state (no activity yet) with CTA “Start training”
  - error state with retry button
- Tone/style: competitive but clean; glass surfaces; accent neon highlights top ranks.

## Screen: Leaderboard (mobile-first variant)
- Goal: same content optimized mobile.
- Layout:
  - Stack “Your rank” then podium then list
  - Sticky top: timeframe + search
  - Large tap targets; list rows compact
- Components: same primitives
- States: same as desktop

---

## Screen (P0): Trombinoscope (desktop-first)
- Goal: browse directory, filter/sort, follow/unfollow, selection mode; admin edits if allowed.
- Layout:
  - Top tools row:
    - Search with clear
    - Followed filter chip
    - View toggle (grid/table)
    - Page size select
    - FilterBar actions (Filters/Sort/Reset) with badges
    - Selection mode toggle
    - Results count
  - Sticky controls (when scrolling): tools + active chips
  - Main area: grid cards or table
  - Peek drawer/dialog: person details + actions (follow/edit)
  - Pagination or infinite scroll sentinel
- Components: FilterBar, ToggleButtonGroup, ContentCard list items, Table/Grid cards, Peek Drawer, StatusChip, SkeletonBlock, Toast.
- States: loading with delay, empty vs error banner, selection mode on/off, infinite scroll loading, admin mode hides follow if needed.

## Screen: Trombinoscope (mobile-first variant)
- Goal: same features optimized for mobile, drawer-first interaction.
- Layout:
  - Search full-width
  - Chips/controls wrap below
  - Default view: single-column grid
  - Peek in full-height drawer
  - Selection toolbar sticky bottom
- Components: same primitives; large tap targets.
- States: same as desktop.

---

## Screen: Courses Hub
- Goal: manage learning courses per mode, view progress, continue or reset.
- Layout:
  - Header + “Manage my courses” action
  - Stack of CourseQuickStart cards per mode (progress + CTA)
  - Kebab actions for reset (danger)
  - ConfirmDialog reset with checkbox + “type RESET”
- Components: CourseQuickStart, SectionCard, LinearProgress, Menu, ConfirmDialog, SkeletonBlock, Toast.
- States: loading stats, empty (no courses), reset in progress.

---

## Screen: Admin Change Requests
- Goal: process attribute change requests with search/sort/tabs and review modal.
- Layout:
  - Header row:
    - Title + count chip
    - Search
    - Sort controls
    - Refresh + last updated
  - Tabs: Pending / History
  - Table with sticky header:
    - Person, Attribute, Proposed values, Reason, Requester, Created, Status (+ resolved by in history)
  - Pagination
  - Review dialog (approve/reject + comment)
  - Optional person peek dialog
- Components: Tabs, Table, StatusChips, FilterBar-lite (search/sort/reset), Review Dialog, SkeletonBlock, InlineAlert, Toast.
- States: loading skeleton (min duration), empty (no CR / no results), error banner, partial approvals.
