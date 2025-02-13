import {createBrowserRouter, Navigate} from "react-router-dom";
// import { Layout } from "../pages/components/Layout";
import ProtectedRoute from "./ProtectedRoute";
import { Profile } from "../../scenes/profile/profile";
import { PersonsTable } from "../persons/personsTable";
import SignIn from "../../scenes/sign-in/SignIn";
import SignUp from "../../scenes/sign-up/SignUp";
import Menu from "../../scenes/menu/menu";
import { Layout } from "../layout/Layout";
import Quiz from "../../scenes/quiz/quiz";

const router = createBrowserRouter([
    {
      path: "/",
      children: [
        {
          index: true,
          element: (
            <Layout isMenu={true}>
              <ProtectedRoute element={<Menu />} />
            </Layout>
          )
        },
        {
          path: "profile",
          element: (
            <Layout>
              <ProtectedRoute element={<Profile />} />
            </Layout>
          )
        },
        {
          path: "quiz",
          element: (
            <Layout>
              <ProtectedRoute element={<Quiz />} />
            </Layout>
          )
        },
        {
          path: "persons",
          element: (
            <Layout>
              <ProtectedRoute element={<PersonsTable />} />
            </Layout>
          )
        },
        {
          path: "signin",
          element: <SignIn />
        },
        {
          path: "signup",
          element: <SignUp />
        },
        {
          path: "*",
          element: <Navigate to="/" replace />
        }
      ]
    }
  ]);
  

export { router };