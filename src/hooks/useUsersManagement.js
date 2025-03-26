import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useSupabaseQuery } from "@/lib/supabase";
import { EDGE_FUNCTIONS } from "@/constants/api";
import { useRole } from "@/providers/RoleProvider";

/**
 * Core hook for managing users, organizations, and invitations in the application
 *
 * This hook is responsible for:
 * - Managing users via Clerk and Supabase
 * - Managing organizations in Supabase
 * - Handling user invitations
 * - Managing permissions and access control
 * - Handling all related CRUD operations
 *
 * It serves as the data management layer, handling all API calls and state management.
 * The presentation layer (useUsersTable) builds on top of this hook for displaying data.
 *
 * Key features:
 * - Integrated Clerk authentication
 * - Role-based access control
 * - Organization management
 * - Invitation system
 * - Optimistic updates
 * - Proper error handling
 * - Loading states
 */
export function useUsersManagement() {
    const { getToken } = useAuth();
    const { capabilities } = useRole();
    const executeQuery = useSupabaseQuery();

    // Data states
    const [users, setUsers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [organisationsList, setOrganisationsList] = useState([]);
    const [organisationLookup, setOrganisationLookup] = useState({});

    // Loading and operation states
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    // Refs to track component mount state and fetch status
    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);
    const isInitialFetch = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        console.log("useUsersManagement mounted");
        isMounted.current = true;
        return () => {
            console.log("useUsersManagement unmounting");
            isMounted.current = false;
        };
    }, []);

    /**
     * Fetch all user-related data - users, invitations, and organisations
     */
    const fetchUserData = useCallback(async () => {
        // Prevent multiple concurrent fetches
        if (fetchInProgress.current) {
            console.log("Fetch already in progress, skipping");
            return;
        }

        console.log("Starting fetchAllData");
        fetchInProgress.current = true;

        if (!isMounted.current) {
            console.log("Component not mounted, skipping fetch");
            fetchInProgress.current = false;
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (!isMounted.current) {
                console.log("Component unmounted during token fetch, aborting");
                return;
            }

            console.log("Fetching data");

            // Fetch all data in parallel
            const [orgsResponse, usersResponse, invitationsResponse] =
                await Promise.all([
                    executeQuery((client) =>
                        client.from("organisations").select("*").order("name")
                    ),
                    executeQuery((client) =>
                        client.functions.invoke(
                            EDGE_FUNCTIONS.MANAGE_USERS.GET,
                            {
                                method: "GET",
                            }
                        )
                    ),
                    executeQuery((client) =>
                        client.functions.invoke(
                            EDGE_FUNCTIONS.INVITATIONS.PENDING,
                            {
                                method: "GET",
                            }
                        )
                    ),
                ]);

            if (!isMounted.current) {
                console.log("Component unmounted during data fetch, aborting");
                return;
            }

            // Handle organizations
            if (orgsResponse.error) throw orgsResponse.error;
            const orgs = orgsResponse.data || [];

            // Create organizations lookup
            const orgLookup = orgs.reduce((acc, org) => {
                acc[org.id] = org.name;
                return acc;
            }, {});

            // Handle users response
            if (usersResponse.error) throw usersResponse.error;
            const users = usersResponse.data || [];

            // Handle invitations response
            if (invitationsResponse.error) throw invitationsResponse.error;
            const invitations = invitationsResponse.data || [];

            console.log("Debug - Fetched invitations:", invitations);
            console.log("Debug - Current invitations state:", invitations);

            if (!isMounted.current) {
                console.log("Component unmounted during processing, aborting");
                return;
            }

            console.log("Setting state with processed data");
            setOrganisationsList(orgs);
            setOrganisationLookup(orgLookup);
            setUsers(users);
            setInvitations(invitations);
            console.log(
                "Debug - New invitations state after update:",
                invitations
            );
            setError(null);
            setIsLoading(false);
            console.log("State updated successfully");

            return {
                success: true,
                organisations: orgs,
                organisationLookup: orgLookup,
                users,
                invitations,
            };
        } catch (err) {
            console.error("Error fetching data:", err);
            if (isMounted.current) {
                setError(err.message);
                setIsLoading(false);
            }
            return {
                success: false,
                error: err.message,
            };
        } finally {
            fetchInProgress.current = false;
        }
    }, [executeQuery]);

    /**
     * Fetch only organizations data
     */
    const fetchOrganisationsOnly = useCallback(async () => {
        if (!isMounted.current) {
            return;
        }

        try {
            const { data: orgs, error: orgsError } = await executeQuery(
                (client) =>
                    client.from("organisations").select("*").order("name")
            );

            if (orgsError) throw orgsError;

            if (!isMounted.current) return;

            // Create organizations lookup
            const orgLookup = orgs.reduce((acc, org) => {
                acc[org.id] = org.name;
                return acc;
            }, {});

            setOrganisationsList(orgs);
            setOrganisationLookup(orgLookup);

            return {
                success: true,
                organisations: orgs,
                organisationLookup: orgLookup,
            };
        } catch (err) {
            console.error("Error fetching organizations:", err);
            if (isMounted.current) {
                setError(err.message);
            }
            return {
                success: false,
                error: err.message,
            };
        }
    }, [executeQuery]);

    // Initial data fetch
    useEffect(() => {
        if (!isInitialFetch.current) {
            console.log("Initial fetch already done, skipping");
            return;
        }

        console.log("Setting up initial fetch effect");
        let ignore = false;

        async function initFetch() {
            try {
                if (!ignore && isMounted.current) {
                    console.log("Starting initial fetch");
                    await fetchUserData();
                    isInitialFetch.current = false;
                }
            } catch (err) {
                console.error("Error in initial fetch:", err);
            }
        }

        initFetch();

        return () => {
            console.log("Cleaning up initial fetch effect");
            ignore = true;
        };
    }, [fetchUserData]);

    /**
     * Delete a user with permission check
     */
    const deleteUser = useCallback(
        async (clerkId, userRole) => {
            if (!clerkId || !userRole) {
                return false;
            }

            // Check permissions based on user role
            const canDelete =
                (userRole === "admin" && capabilities?.canDeleteAdmins) ||
                (userRole === "manager" && capabilities?.canDeleteManagers) ||
                (userRole === "agent" && capabilities?.canDeleteAgents);

            if (!canDelete) {
                throw new Error(
                    "You don't have permission to delete this user"
                );
            }

            if (isMounted.current) {
                setIsDeleting(true);
                setError(null);
            }

            try {
                const { error: deleteError } = await executeQuery((client) =>
                    client.functions.invoke(
                        EDGE_FUNCTIONS.MANAGE_USERS.DELETE,
                        {
                            method: "DELETE",
                            body: { userId: clerkId },
                        }
                    )
                );

                if (deleteError) throw deleteError;

                // Refresh users after deletion
                await fetchUserData();

                if (isMounted.current) {
                    setIsDeleting(false);
                }

                return true;
            } catch (err) {
                if (isMounted.current) {
                    setError(err.message || "Failed to delete user");
                    setIsDeleting(false);
                }

                return false;
            }
        },
        [executeQuery, fetchUserData, capabilities]
    );

    /**
     * Update a user
     */
    const updateUser = useCallback(
        async (clerkId, userData) => {
            if (!clerkId || !userData) {
                return false;
            }

            if (isMounted.current) {
                setIsUpdating(true);
                setError(null);
            }

            try {
                // Process name fields for direct Clerk API fields
                const {
                    first_name,
                    last_name,
                    role,
                    organisation_id,
                    ...rest
                } = userData;

                const processedData = {
                    // Direct Clerk API fields
                    first_name,
                    last_name,

                    // Metadata fields - explicitly processed
                    role,
                    organisation_id,

                    // Any other fields go to metadata
                    ...rest,
                };

                const { error: updateError } = await executeQuery((client) =>
                    client.functions.invoke(
                        EDGE_FUNCTIONS.MANAGE_USERS.UPDATE,
                        {
                            method: "PATCH",
                            body: {
                                userId: clerkId,
                                data: processedData,
                            },
                        }
                    )
                );

                if (updateError) {
                    throw new Error(
                        updateError.message || "Failed to update user"
                    );
                }

                // Refresh users after update
                await fetchUserData();

                if (isMounted.current) {
                    setIsUpdating(false);
                }

                return true;
            } catch (err) {
                console.error("Error in updateUser:", err);
                if (isMounted.current) {
                    setError(err.message || "Failed to update user");
                    setIsUpdating(false);
                }

                return false;
            }
        },
        [executeQuery, fetchUserData]
    );

    /**
     * Send an invitation
     */
    const sendInvitation = useCallback(
        async (invites, clerkToken) => {
            if (!invites || !Array.isArray(invites) || invites.length === 0) {
                return false;
            }

            if (!clerkToken) {
                return false;
            }

            if (isMounted.current) {
                setIsLoading(true);
                setError(null);
            }

            try {
                console.log("Debug - Sending invites:", invites);
                const { error: inviteError } = await executeQuery((client) =>
                    client.functions.invoke(EDGE_FUNCTIONS.INVITATIONS.SEND, {
                        method: "POST",
                        body: {
                            invites: invites,
                            clerkToken: clerkToken,
                        },
                    })
                );

                if (inviteError) throw inviteError;

                // Refresh invitations after sending
                console.log("Debug - Refreshing data after sending invites");
                const refreshResult = await fetchUserData();
                console.log("Debug - Refresh result:", refreshResult);

                if (isMounted.current) {
                    setIsLoading(false);
                }

                return true;
            } catch (err) {
                console.error("Debug - Error in sendInvitation:", err);
                if (isMounted.current) {
                    setError(err.message || "Failed to send invitation");
                    setIsLoading(false);
                }

                return false;
            }
        },
        [executeQuery, fetchUserData]
    );

    /**
     * Revoke an invitation with permission check
     */
    const revokeInvitation = useCallback(
        async (invitationId, invitedRole) => {
            if (!invitationId || !invitedRole) {
                return false;
            }

            // Check permissions based on invited role
            const canRevoke =
                (invitedRole === "admin" && capabilities?.canInviteAdmins) ||
                (invitedRole === "manager" &&
                    capabilities?.canInviteManagers) ||
                (invitedRole === "agent" && capabilities?.canInviteAgents);

            if (!canRevoke) {
                throw new Error(
                    "You don't have permission to revoke this invitation"
                );
            }

            if (isMounted.current) {
                setIsLoading(true);
                setError(null);
            }

            try {
                const { error: revokeError } = await executeQuery((client) =>
                    client.functions.invoke(EDGE_FUNCTIONS.INVITATIONS.REVOKE, {
                        method: "POST",
                        body: { inviteId: invitationId },
                    })
                );

                if (revokeError) throw revokeError;

                // Refresh invitations after revocation
                await fetchUserData();

                if (isMounted.current) {
                    setIsLoading(false);
                }

                return true;
            } catch (err) {
                if (isMounted.current) {
                    setError(err.message || "Failed to revoke invitation");
                    setIsLoading(false);
                }

                return false;
            }
        },
        [executeQuery, fetchUserData, capabilities]
    );

    /**
     * Add a new organisation
     */
    const addOrganisation = useCallback(
        async (name) => {
            if (!name) {
                return false;
            }

            if (isMounted.current) {
                setIsLoading(true);
                setError(null);
            }

            try {
                const { data, error: insertError } = await executeQuery(
                    (client) =>
                        client
                            .from("organisations")
                            .insert([{ name }])
                            .select("id, name, created_at, updated_at")
                            .single()
                );

                if (insertError) {
                    throw insertError;
                }

                // Update local state immediately
                if (isMounted.current) {
                    setOrganisationsList((prev) => [...prev, data]);
                    setOrganisationLookup((prev) => ({
                        ...prev,
                        [data.id]: data.name,
                    }));
                    setIsLoading(false);
                }

                return data;
            } catch (err) {
                console.error("Failed to add organisation:", err);
                if (isMounted.current) {
                    setError(err.message || "Failed to add organisation");
                    setIsLoading(false);
                }

                return false;
            }
        },
        [executeQuery]
    );

    /**
     * Update an organisation
     */
    const updateOrganisation = useCallback(
        async (id, name) => {
            if (!id || !name) {
                return false;
            }

            if (isMounted.current) {
                setIsLoading(true);
                setError(null);
            }

            try {
                const { data, error: updateError } = await executeQuery(
                    (client) =>
                        client
                            .from("organisations")
                            .update({ name })
                            .eq("id", id)
                            .select("id, name, created_at, updated_at")
                            .single()
                );

                if (updateError) {
                    throw updateError;
                }

                // Update local state immediately
                if (isMounted.current) {
                    setOrganisationsList((prev) =>
                        prev.map((org) =>
                            org.id === id ? { ...org, name: data.name } : org
                        )
                    );
                    setOrganisationLookup((prev) => ({
                        ...prev,
                        [id]: data.name,
                    }));
                    setIsLoading(false);
                }

                return data;
            } catch (err) {
                console.error("Failed to update organisation:", err);
                if (isMounted.current) {
                    setError(err.message || "Failed to update organisation");
                    setIsLoading(false);
                }

                return false;
            }
        },
        [executeQuery]
    );

    /**
     * Delete an organisation
     */
    const deleteOrganisation = useCallback(
        async (id) => {
            if (!id) {
                return false;
            }

            if (isMounted.current) {
                setIsLoading(true);
                setError(null);
            }

            try {
                const { error: deleteError } = await executeQuery((client) =>
                    client.from("organisations").delete().eq("id", id)
                );

                if (deleteError) {
                    throw deleteError;
                }

                // Update local state immediately
                if (isMounted.current) {
                    setOrganisationsList((prev) =>
                        prev.filter((org) => org.id !== id)
                    );
                    setOrganisationLookup((prev) => {
                        const newLookup = { ...prev };
                        delete newLookup[id];
                        return newLookup;
                    });
                    setIsLoading(false);
                }

                return true;
            } catch (err) {
                console.error("Failed to delete organisation:", err);
                if (isMounted.current) {
                    setError(err.message || "Failed to delete organisation");
                    setIsLoading(false);
                }

                return false;
            }
        },
        [executeQuery]
    );

    // Return values from the hook
    return {
        users,
        invitations,
        organisations: organisationsList,
        organisationLookup,
        isLoading,
        isUpdating,
        isDeleting,
        error,
        refreshData: fetchUserData,
        refreshOrganisations: fetchOrganisationsOnly,
        deleteUser,
        updateUser,
        sendInvitation,
        revokeInvitation,
        addOrganisation,
        updateOrganisation,
        deleteOrganisation,
    };
}
