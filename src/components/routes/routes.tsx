// src/components/routes/routes.tsx
import React from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import { AdminDataLayout } from "../../contexts/AdminDataContext";
import { CourseStatsProvider } from "../../contexts/CourseStatsContext";
import { CourseProvider } from "../../contexts/CoursesContext";
import { QuizOptionsProvider } from "../../contexts/QuizOptionsContext";
import { QuizSessionProvider } from "../../contexts/QuizSessionContext";

import AdminHome from "../../scenes/admin/dashboard/AdminHome";
import PersonAdminPage from "../../scenes/admin/persons/PersonAdminPage";
import CoursesHub from "../../scenes/courses/CoursesHub";
import StartCourse from "../../scenes/courses/StartCourse";
import Menu from "../../scenes/menu/menu";
import ProfilePage from "../../scenes/profile/profile";
import ProgressionQuiz from "../../scenes/quiz/ProgressionQuiz";
import QuizOptions from "../../scenes/quiz/QuizOptions";
import { TrainingQuiz } from "../../scenes/quiz/TrainingQuiz";
import SettingsPage from "../../scenes/settings/SettingsPage";
import ForgotPasswordPage from "../../scenes/sign-in/ForgotPasswordPage";
import ResetPasswordPage from "../../scenes/sign-in/ResetPasswordPage";
import SignIn from "../../scenes/sign-in/SignIn";
import SignUp from "../../scenes/sign-up/SignUp";
import TrombinoscopePage from "../../scenes/trombinoscope/TrombinoscopePage";

import AdminLayout from "../layout/AdminLayout";
import { Layout } from "../layout/Layout";

import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

import { PersonsDirectoryProvider } from "../../contexts/PersonsDirectoryContext";
import { adminDataSource } from "../../contexts/personsDirectory.dataSource";
import { AdminCRCacheProvider } from "../../contexts/AdminCRCacheContext";

import { ProfileProvider } from "../../contexts/ProfileContext";
import AdminAttributesPage from "../../scenes/admin/attributes/AdminAttributesPage";
import AdminChangeRequestsPage from "../../scenes/admin/change-requests/AdminChangeRequestsPage";

import AdminMembers from "../../scenes/admin/invitations/AdminMembers";
import InvitationPreviewPage from "../../scenes/invitations/InvitationPreviewPage";
import VerifyEmailPage from "../../scenes/sign-up/VerifyEmailPage";

import LeaderboardPage from "../../scenes/leaderboard/LeaderboardPage";
import XpHubPage from "../../scenes/leaderboard/XpHubPage";
import Onboarding from "../../scenes/onboarding/Onboarding";
import WithOrgLayout from "../layout/WithOrgLayout";
import OrgProtectedRoute from "./OrgProtectedRoute";

import { useQuizOptions } from "../../contexts/QuizOptionsContext";

const TrainingQuizRoute: React.FC = () => {
  const { optionsFingerprint } = useQuizOptions();

  return (
    <Layout headerTitle="Training" onBack="/">
      <TrainingQuiz key={optionsFingerprint} />
    </Layout>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    children: [
      // =========================
      // ROUTES PUBLIQUES
      // =========================
      { path: "signin", element: <SignIn /> },
      { path: "signup", element: <SignUp /> },
      { path: "signup/verify-email", element: <VerifyEmailPage /> },
      { path: "auth/verify-email", element: <VerifyEmailPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },

      { path: "invitation", element: <InvitationPreviewPage /> },
      { path: "invite", element: <Navigate to="/invitation" replace /> },

      // =========================
      // ZONE AUTHENTIFIÉE
      // =========================
      {
        element: (
          <ProfileProvider>
            <CourseProvider>
              <CourseStatsProvider>
                <ProtectedRoute element={<Outlet />} />
              </CourseStatsProvider>
            </CourseProvider>
          </ProfileProvider>
        ),
        children: [
          {
            path: "onboarding",
            element: (
              <Layout isMenu>
                <Onboarding />
              </Layout>
            ),
          },

          {
            path: "settings",
            element: (
              <Layout headerTitle="Settings" onBack="/">
                <SettingsPage />
              </Layout>
            ),
          },

          {
            element: <OrgProtectedRoute element={<WithOrgLayout />} />,
            children: [
              {
                index: true,
                element: (
                  <Layout isMenu>
                    <Menu />
                  </Layout>
                ),
              },

              {
                path: "leaderboard",
                children: [
                  {
                    index: true,
                    element: (
                      <Layout headerTitle="Classement" onBack="/">
                        <LeaderboardPage />
                      </Layout>
                    ),
                  },
                ],
              },

              {
                path: "xp",
                element: (
                  <Layout headerTitle="XP" onBack="/leaderboard">
                    <XpHubPage />
                  </Layout>
                ),
              },

              {
                path: "admin",
                element: (
                  <RoleProtectedRoute
                    allowedRoles={["VIEWER", "EDITOR", "ADMIN", "OWNER"]}
                    element={
                      <AdminCRCacheProvider>
                        <AdminDataLayout>
                          <PersonsDirectoryProvider dataSource={adminDataSource}>
                            <AdminLayout />
                          </PersonsDirectoryProvider>
                        </AdminDataLayout>
                      </AdminCRCacheProvider>
                    }
                    redirectPath="/"
                  />
                ),
                children: [
                  { index: true, element: <AdminHome /> },
                  { path: "persons", element: <PersonAdminPage /> },
                  { path: "persons/:id", element: <PersonAdminPage /> },
                  { path: "change-requests", element: <AdminChangeRequestsPage /> },
                  { path: "change-requests/:id", element: <AdminChangeRequestsPage /> },
                  { path: "attributes", element: <AdminAttributesPage /> },
                  { path: "members", element: <AdminMembers /> },
                ],
              },

              {
                path: "trombinoscope",
                element: (
                  <Layout headerTitle="Trombinoscope">
                    <TrombinoscopePage />
                  </Layout>
                ),
              },
              {
                path: "trombinoscope/:id",
                element: (
                  <Layout headerTitle="Trombinoscope">
                    <TrombinoscopePage />
                  </Layout>
                ),
              },

              {
                path: "profile",
                element: (
                  <Layout headerTitle="Profile">
                    <ProfilePage />
                  </Layout>
                ),
              },

              {
                element: (
                  <QuizSessionProvider>
                    <Outlet />
                  </QuizSessionProvider>
                ),
                children: [
                  {
                    path: "training",
                    element: (
                      <QuizOptionsProvider>
                        <Outlet />
                      </QuizOptionsProvider>
                    ),
                    children: [
                      { index: true, element: <TrainingQuizRoute /> },
                      {
                        path: "options",
                        element: (
                          <Layout headerTitle="Training Options" onBack="/training">
                            <QuizOptions />
                          </Layout>
                        ),
                      },
                    ],
                  },

                  {
                    path: "course",
                    element: <Outlet />,
                    children: [
                      {
                        index: true,
                        element: (
                          <Layout headerTitle="Course">
                            <ProgressionQuiz />
                          </Layout>
                        ),
                      },
                      {
                        path: "hub",
                        element: (
                          <Layout headerTitle="Mes parcours" onBack="/">
                            <CoursesHub />
                          </Layout>
                        ),
                      },
                      {
                        path: "new",
                        element: (
                          <Layout headerTitle="Start Course" onBack="/course/hub">
                            <StartCourse />
                          </Layout>
                        ),
                      },
                    ],
                  },
                ],
              },

              // fallback ORG zone
              { path: "*", element: <Navigate to="/" replace /> },
            ],
          },

          // fallback AUTH zone
          { path: "*", element: <Navigate to="/" replace /> },
        ],
      },

      // fallback global: renvoie vers signin (optionnel mais pratique)
      { path: "*", element: <Navigate to="/signin" replace /> },
    ],
  },
]);

export { router };
