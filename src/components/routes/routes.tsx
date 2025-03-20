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
import { QuizOptionsProvider } from "../../contexts/QuizOptionsProvider";
import QuizOptions from "../../scenes/quiz/QuizOptions";

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
        path: "challenges",
        element: (
          <Layout headerTitle="Challenges">
            <ProtectedRoute element={<ChallengeMenu />} />
          </Layout>
        ),
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
