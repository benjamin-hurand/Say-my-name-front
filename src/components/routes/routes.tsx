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

const router = createBrowserRouter([
  {
    path: "/",
    element: <GlobalDataLayout />,
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

      // ——— Section “Quiz” pédagogique ———
      {
        path: "quiz",
        element: (
          <QuizOptionsProvider>
            <Outlet />
          </QuizOptionsProvider>
        ),
        children: [
          {
            index: true,
            element: (
              <Layout headerTitle="Quiz">
                <ProtectedRoute element={<TrainingQuiz />} />
              </Layout>
            ),
          },
          {
            path: "options",
            element: (
              <Layout headerTitle="Quiz Options" onBack="/quiz">
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
          <ChallengesProvider>
            {/* Ici on place le provider d’attempt autour de Menu & Quiz */}
            <ChallengeAttemptProvider>
              <Outlet />
            </ChallengeAttemptProvider>
          </ChallengesProvider>
        ),
        children: [
          // Liste / menu des challenges
          {
            index: true,
            element: (
              <ChallengeLayout>
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
            path: ":attemptId",
            element: (
              <ChallengeLayout>
                <ProtectedRoute element={<ChallengeQuiz />} />
              </ChallengeLayout>
            ),
          },
          {
            path: ":attemptId/summary",
            element: (
              <ChallengeLayout>
                <ProtectedRoute element={<ChallengeSummary />} />
              </ChallengeLayout>
            ),
          },
        ],
      },

      {
        path: "persons",
        element: (
          <Layout headerTitle="Persons">
            <ProtectedRoute element={<PersonsTable />} />
          </Layout>
        ),
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
