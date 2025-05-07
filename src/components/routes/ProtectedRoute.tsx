import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({ element }: { element: React.JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    
    // When mounted, console log the authentication status
    React.useEffect(() => {
        // console.log("ProtectedRoute mounted. Authentication status:", isAuthenticated);
    }, [isAuthenticated]);

    return isAuthenticated ? element : <Navigate to="/signin" />;
};

export default ProtectedRoute;