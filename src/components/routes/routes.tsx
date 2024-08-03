import {createBrowserRouter, Navigate} from "react-router-dom";
// import { Layout } from "../pages/components/Layout";
import ProtectedRoute from "./ProtectedRoute";
import { Profile } from "../../scenes/profile/profile";
import { PersonsTable } from "../persons/personsTable";
import SignIn from "../../scenes/sign-in/SignIn";
import SignUp from "../../scenes/sign-up/SignUp";
import { Quiz } from "../../scenes/quiz/quiz";
import Menu from "../../scenes/menu/menu";
import { Layout } from "../layout/Layout";

const router = createBrowserRouter([
    {
        path: "/",
        children: [
            {
                index: true,
                element: <Layout children={<ProtectedRoute element={<Menu />} />} />
            },{
                path: "profile",
                element: <Layout children={<ProtectedRoute element={<Profile />} />} />
            },{
                path: "quiz",
                element: <Layout children={<ProtectedRoute element={<Quiz />} />} />
            },{
                path: "persons",
                element: <Layout children={<ProtectedRoute element={<PersonsTable />} />} />
            },{
                path: "**",
                element: <Navigate to="/" replace />
            },{
                path: "signin",
                element: <SignIn />
            },{
                path: "signup",
                element: <SignUp />
            }  
        ]
    }
]);

export { router };