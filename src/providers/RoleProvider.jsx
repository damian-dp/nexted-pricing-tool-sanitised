import { createContext, useContext, useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { USER_ROLES, ROLE_CAPABILITIES } from "../constants/roles";
import { useToast } from "@/hooks/use-toast";

// Create a context for the role state
const RoleContext = createContext(null);

export const RoleProvider = ({ children }) => {
    const { toast } = useToast();
    const { isLoaded: authLoaded } = useAuth();
    const { isLoaded: userLoaded, isSignedIn, user } = useUser();
    const [roleState, setRoleState] = useState({
        role: null,
        isAdmin: false,
        isManager: false,
        isAgent: false,
        loading: true,
        error: null,
        capabilities: {},
    });

    useEffect(() => {
        let isMounted = true;

        const checkUserRole = async () => {
            // Skip fetching role if not signed in
            if (!isSignedIn || !user) {
                console.log(
                    "RoleProvider: User not signed in, skipping role check"
                );
                if (isMounted) {
                    setRoleState((prevState) => ({
                        ...prevState,
                        loading: false,
                        role: null,
                        capabilities: {},
                    }));
                }
                return;
            }

            console.log("RoleProvider: User signed in, checking role");

            try {
                const clerkRole = user.publicMetadata?.role;

                // More explicit role validation
                if (!clerkRole || !USER_ROLES[clerkRole.toUpperCase()]) {
                    const errorMessage =
                        "Your user account doesn't have a valid role assigned. Please contact an administrator.";
                    console.error("RoleProvider:", errorMessage);

                    if (isMounted) {
                        setRoleState((prevState) => ({
                            ...prevState,
                            loading: false,
                            error: errorMessage,
                        }));

                        toast({
                            title: "Role Error",
                            description: errorMessage,
                            variant: "destructive",
                        });
                    }
                    return;
                }

                if (isMounted) {
                    console.log(`RoleProvider: User role set to ${clerkRole}`);
                    setRoleState({
                        role: clerkRole,
                        isAdmin: clerkRole === USER_ROLES.ADMIN,
                        isManager: clerkRole === USER_ROLES.MANAGER,
                        isAgent: clerkRole === USER_ROLES.AGENT,
                        loading: false,
                        error: null,
                        capabilities: ROLE_CAPABILITIES[clerkRole],
                    });
                }
            } catch (error) {
                console.error("RoleProvider: Error checking user role:", error);
                if (isMounted) {
                    setRoleState((prevState) => ({
                        ...prevState,
                        loading: false,
                        error: "An error occurred while checking your role. Please try refreshing the page.",
                    }));

                    toast({
                        title: "Role Check Error",
                        description:
                            "Failed to verify your user role. Please refresh the page or contact support if the issue persists.",
                        variant: "destructive",
                    });
                }
            }
        };

        // Only check role if auth and user are loaded
        if (!authLoaded || !userLoaded) {
            console.log("RoleProvider: Waiting for auth and user to load");
            return;
        }

        checkUserRole();

        return () => {
            isMounted = false;
        };
    }, [authLoaded, userLoaded, isSignedIn, user, toast]);

    // Show loading state while auth or user is loading
    if (!authLoaded || !userLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-sm text-muted-foreground">
                        Loading user role...
                    </p>
                </div>
            </div>
        );
    }

    // Show error state if there's an error and user is signed in
    if (roleState.error && isSignedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <div className="p-4 rounded-full bg-destructive/10">
                        <svg
                            className="h-6 w-6 text-destructive"
                            fill="none"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Role Error</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {roleState.error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const value = {
        role: roleState.role,
        isAdmin: roleState.isAdmin,
        isManager: roleState.isManager,
        isAgent: roleState.isAgent,
        loading: roleState.loading,
        error: roleState.error,
        capabilities: roleState.capabilities,
        userOrgsCount: user?.organisationMemberships?.length || 0,
    };

    return (
        <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
    );
};

// Custom hook to access the role data
export const useRole = () => {
    const context = useContext(RoleContext);
    if (context === null) {
        throw new Error("useRole must be used within a RoleProvider");
    }
    return context;
};

export default RoleProvider;
