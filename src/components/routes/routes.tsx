import {createBrowserRouter, Navigate} from "react-router-dom";
// import { Layout } from "../pages/components/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Home from "../../scenes/home/home";
import { Profile } from "../../scenes/profile/profile";
import { PersonsTable } from "../persons/personsTable";
import SignIn from "../../scenes/sign-in/SignIn";
import SignUp from "../../scenes/sign-up/SignUp";

const router = createBrowserRouter([
    {
        path: "/",
        children: [
            {
                index: true,
                element: <ProtectedRoute element={<Home />} />
            },{
                path: "profile",
                element: <ProtectedRoute element={<Profile />} />
            },{
                path: "persons",
                element: <ProtectedRoute element={<PersonsTable />} />
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