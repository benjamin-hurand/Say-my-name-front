import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { Profile } from "../../scenes/profile/profile";
import { PersonsTable } from "../persons/personsTable";
import SignIn from "../../scenes/sign-in/SignIn";
import SignUp from "../../scenes/sign-up/SignUp";
import Menu from "../../scenes/menu/menu";
import { Layout } from "../layout/Layout";
import { QuizOptionsProvider } from "../../contexts/QuizOptionsContext";
import QuizOptions from "../../scenes/quiz/QuizOptions";
import AddChallengeForm from "../../scenes/challenges/menu/AddChallengeForm";
import { ChallengesProvider } from "../../contexts/ChallengesContext";
import ChallengeLayout from "../layout/ChallengeLayout";
import { TrainingQuiz } from "../../scenes/quiz/TrainingQuiz";
import GlobalDataLayout from "../layout/GlobalDataLayout";
import ChallengeMenu from "../../scenes/challenges/menu/challengeMenu";
import { ChallengeAttemptProvider } from "../../contexts/ChallengeAttemptContext";
import { ChallengeQuiz } from "../../scenes/quiz/ChallengeQuiz";
import ChallengeSummary from "../../scenes/challenges/attempt/ChallengeSummary";
import { QuizSessionProvider } from "../../contexts/QuizSessionContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
            <GlobalDataLayout />
        ),
    children: [
      { index: true, element: (
          <Layout isMenu>
            <ProtectedRoute element={<Menu />} />
          </Layout>
        )
      },
      {
        path: "profile",
        element: (
          <Layout headerTitle="Profile">
            <ProtectedRoute element={<Profile />} />
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
    ],
  },
]);

export { router };
