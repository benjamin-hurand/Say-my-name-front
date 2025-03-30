import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { Profile } from "../../scenes/profile/profile";
import { PersonsTable } from "../persons/personsTable";
import SignIn from "../../scenes/sign-in/SignIn";
import SignUp from "../../scenes/sign-up/SignUp";
import Menu from "../../scenes/menu/menu";
import { Layout } from "../layout/Layout";
import Quiz from "../../scenes/quiz/quiz";
import ChallengeMenu from "../../scenes/challenges/menu/challengeMenu";
import { QuizOptionsProvider } from "../../contexts/QuizOptionsContext";
import QuizOptions from "../../scenes/quiz/QuizOptions";
import AddChallengeForm from "../../scenes/challenges/menu/AddChallengeForm";
import FiltersPage from "../../scenes/challenges/menu/FiltersPage";
import { ChallengesProvider } from "../../contexts/ChallengesContext";
import ChallengeLayout from "../layout/ChallengeLayout";

const router = createBrowserRouter([
  {
    path: "/",
    children: [
      {
        index: true,
        // Pour le menu principal, on n'affiche pas de header (ou on l'affiche sans bouton retour)
        element: (
          <Layout isMenu={true}>
            <ProtectedRoute element={<Menu />} />
          </Layout>
        ),
      },
      {
        path: "profile",
        element: (
          <Layout headerTitle="Profile">
            <ProtectedRoute element={<Profile />} />
          </Layout>
        ),
      },
      {
        // Ici, on enveloppe la section quiz avec le provider et un Outlet, sans Layout fixe
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
                <ProtectedRoute element={<Quiz />} />
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
      {
        // Envelopper la section challenges avec ChallengesProvider
        path: "challenges",
        element: (
          <ChallengesProvider>
            <Outlet />
          </ChallengesProvider>
        ),
        children: [
          {
            index: true,
            element: (
              <ChallengeLayout>
                <ProtectedRoute element={<ChallengeMenu />} />
              </ChallengeLayout>
            ),
          },
          {
            path: "new",
            element: (
              <Layout headerTitle="Create challenge" onBack="/challenges">
                <ProtectedRoute element={<AddChallengeForm />} />
              </Layout>
            ),
          },
          {
            path: "filters",
            element: (
              <Layout headerTitle="Filter challenges" onBack="/challenges">
                <ProtectedRoute element={<FiltersPage />} />
              </Layout>
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
      {
        path: "signin",
        element: <SignIn />,
      },
      {
        path: "signup",
        element: <SignUp />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export { router };
