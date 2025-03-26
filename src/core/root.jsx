import { Routes, Route } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { PublicRedirect, ProtectedRedirect } from "@/core/redirects";
import { AuthRoute } from "@/core/routes/auth";
import { AppRoutes } from "@/core/routes/app";
import { ThemeProvider } from "@/providers/ThemeProvider";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
    throw new Error("Missing Clerk Publishable Key");
}

export default function Root() {
    return (
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <ClerkProvider
                publishableKey={clerkPubKey}
                signInUrl="/"
                signUpUrl="/"
            >
                <BrowserRouter>
                    <main className="relative flex min-h-screen w-full bg-background">
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <PublicRedirect>
                                        <AuthRoute />
                                    </PublicRedirect>
                                }
                            />
                            <Route
                                path="/*"
                                element={
                                    <ProtectedRedirect>
                                        <AppRoutes />
                                    </ProtectedRedirect>
                                }
                            />
                        </Routes>
                    </main>
                    <Toaster />
                </BrowserRouter>
            </ClerkProvider>
        </ThemeProvider>
    );
}
