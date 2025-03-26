import { Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

/**
 * Redirects for public routes (/)
 * Redirects to /dashboard if signed in
 */
export function PublicRedirect({ children }) {
    return (
        <>
            <SignedIn>
                <Navigate to="/dashboard" replace />
            </SignedIn>
            <SignedOut>{children}</SignedOut>
        </>
    );
}

/**
 * Redirects for protected routes (/*)
 * Redirects to / if signed out
 */
export function ProtectedRedirect({ children }) {
    return (
        <>
            <SignedOut>
                <Navigate to="/" replace />
            </SignedOut>
            <SignedIn>{children}</SignedIn>
        </>
    );
}
