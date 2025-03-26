import { SignIn, SignUp } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";

export function AuthPage() {
    const location = useLocation();
    const isSignUp = location.pathname === "/sign-up";

    return (
        <div className="flex w-full justify-center items-center min-h-[calc(100vh-64px)]">
            {isSignUp ? (
                <SignUp
                    forceRedirectUrl="/dashboard"
                    appearance={{
                        elements: {
                            footerAction: "hidden",
                            card: "shadow-md",
                        },
                    }}
                />
            ) : (
                <SignIn
                    forceRedirectUrl="/dashboard"
                    appearance={{
                        elements: {
                            footerAction: "hidden",
                            card: "shadow-md",
                        },
                    }}
                />
            )}
        </div>
    );
}
