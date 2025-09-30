import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { ChallengeAttemptProvider } from "../../contexts/ChallengeAttemptContext";
import { CourseProvider } from "../../contexts/CoursesContext";
import { QuizOptionsProvider } from "../../contexts/QuizOptionsContext";
import { QuizSessionProvider } from "../../contexts/QuizSessionContext";
import ChallengeSummary from "../../scenes/challenges/attempt/ChallengeSummary";
import AddChallengeForm from "../../scenes/challenges/menu/AddChallengeForm";
import ChallengeMenu from "../../scenes/challenges/menu/challengeMenu";
import StartCourse from "../../scenes/courses/StartCourse";
import Menu from "../../scenes/menu/menu";
import ProfilePage from "../../scenes/profile/profile";
import { ChallengeQuiz } from "../../scenes/quiz/ChallengeQuiz";
import ProgressionQuiz from "../../scenes/quiz/ProgressionQuiz";
import QuizOptions from "../../scenes/quiz/QuizOptions";
import { TrainingQuiz } from "../../scenes/quiz/TrainingQuiz";
import SettingsPage from "../../scenes/settings/SettingsPage";
import ForgotPasswordPage from "../../scenes/sign-in/ForgotPasswordPage";
import ResetPasswordPage from "../../scenes/sign-in/ResetPasswordPage";
import SignIn from "../../scenes/sign-in/SignIn";
import SignUp from "../../scenes/sign-up/SignUp";
import TrombinoscopePage from "../../scenes/trombinoscope/TrombinoscopePage";
import ChallengeLayout from "../layout/ChallengeLayout";
import GlobalDataLayout from "../layout/GlobalDataLayout";
import { Layout } from "../layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import { CourseStatsProvider } from "../../contexts/CourseStatsContext";
import CoursesHub from "../../scenes/courses/CoursesHub";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
          <CourseProvider>
            <CourseStatsProvider>
              <GlobalDataLayout />
            </CourseStatsProvider>
          </CourseProvider>
        ),
    children: [
      { index: true, element: (
          <Layout isMenu>
            <ProtectedRoute element={<Menu />} />
          </Layout>
        )
      },
      {
          path: "trombinoscope",
          element: (
            <Layout headerTitle="Trombinoscope">
              <ProtectedRoute element={<TrombinoscopePage />} />
            </Layout>
          ),
        },
      {
        path: "profile",
        element: (
          <Layout headerTitle="Profile">
            <ProtectedRoute element={<ProfilePage />} />
          </Layout>
        ),
      },
      {
        path: "settings",
        element: (
          <Layout headerTitle="Settings" onBack="/">
            <ProtectedRoute element={<SettingsPage />} />
          </Layout>
        ),
      },
      // Ajoutons une route pour regrouper les sections training et challenges en un seul contexte QuizSessionProvider
      {
        element: (
          <QuizSessionProvider>
            <Outlet />
          </QuizSessionProvider>
        ),
        children: [
          // ——— Section "Training" ———
          {
            path: "training",
            element: (
              <QuizOptionsProvider>
                <Outlet />
              </QuizOptionsProvider>
            ),
            children: [
              {
                index: true,
                element: (
                  <Layout headerTitle="Training">
                    <ProtectedRoute element={<TrainingQuiz />} />
                  </Layout>
                ),
              },
              {
                path: "options",
                element: (
                  <Layout headerTitle="Training Options" onBack="/training">
                    <ProtectedRoute element={<QuizOptions />} />
                  </Layout>
                ),
              },
            ],
          },

          // ——— Section “Challenges” (compétition) ———
          {
            path: "challenges",
            element: (
              <ChallengeAttemptProvider>
                <Outlet />
              </ChallengeAttemptProvider>
            ),
            children: [
              // Liste / menu des challenges
              {
                index: true,
                element: (
              <ChallengeLayout onBack="/">
                <ProtectedRoute element={<ChallengeMenu />} />
              </ChallengeLayout>
                ),
              },
              // Création d’un nouveau challenge
              {
                path: "new",
                element: (
              <Layout headerTitle="Créer un challenge" onBack="/challenges">
                <ProtectedRoute element={<AddChallengeForm />} />
              </Layout>
                ),
              },
              // Quiz de l’attempt (sous /challenges/:attemptId)
              {
                path: "quiz",
                element: (
              <ChallengeLayout onBack="/challenges">
                <ProtectedRoute element={<ChallengeQuiz />} />
              </ChallengeLayout>
                ),
              },
              {
                path: "summary/:attemptId?",
                element: (
              <ChallengeLayout onBack="/challenges">
                <ProtectedRoute element={<ChallengeSummary />} />
              </ChallengeLayout>
                ),
              },
            ],
          },
          // --- Section "Mes cours" ---
          {
            path: "course",
            element: (
                  <ProtectedRoute element={<Outlet />} />
            ),
            children: [
              // quiz en cours
              {
                index: true,
                element: (
                  <Layout headerTitle="Course">
                    <ProtectedRoute element={<ProgressionQuiz />} />
                  </Layout>
                ),
              },
              // Hub des parcours
              {
                path: "hub",
                element: (
                  <Layout headerTitle="Mes parcours" onBack="/">
                    <ProtectedRoute element={<CoursesHub />} />
                  </Layout>
                ),
              },
              // création d'un nouveau cours
              {
                path: "new",
                element: (
                  <Layout headerTitle="Start Course" onBack="/course/hub">
                    <ProtectedRoute element={<StartCourse />} />
                  </Layout>
                ),
              },
            ],
          },
        ],
      },

      // fallback
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
  // routes publiques
  {
    path: "/",
    children: [
      { path: "signin", element: <SignIn /> },
      { path: "signup", element: <SignUp /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
    ],
  },
]);

export { router };

