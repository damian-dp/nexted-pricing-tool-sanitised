import { useMemo } from "react";
import { useSharedUsersManagement } from "@/providers/UsersManagementProvider";

/**
 * Hook for managing the presentation layer of the users table
 *
 * This hook is responsible for:
 * - Formatting users and invitations data for table display
 * - Combining users and invitations into a single data structure
 * - Computing derived table states (empty, loading, error states)
 * - Providing table-specific operations
 *
 * It uses useUsersManagement for the underlying data management and adds the presentation layer
 * on top of it. This separation allows for cleaner code organization where:
 * - Data management and API calls live in useUsersManagement
 * - Table-specific formatting and states live here
 *
 * Key features:
 * - Unified view of users and invitations
 * - Consistent data structure for table display
 * - Computed display states
 * - Organization name resolution
 */

const formatUsers = (users, organisationLookup = {}) => {
    if (!users || !Array.isArray(users)) return [];

    return users
        .map((user) => {
            if (!user) return null;

            const organisationId =
                user.organisation_id || user.organisationId || null;
            const name =
                user.name ||
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                user.email ||
                "Unknown User";

            return {
                ...user,
                name,
                type: "user",
                organisation: organisationLookup[organisationId] || "None",
            };
        })
        .filter(Boolean);
};

/**
 * Format raw invitation data into a consistent structure matching users
 * @param {Array} invitations - Raw invitation data from API
 * @param {Object} organisationLookup - Map of organisation IDs to names
 */
const formatInvitations = (invitations, organisationLookup = {}) => {
    if (!invitations || !Array.isArray(invitations)) return [];

    console.log("formatInvitations - Input:", invitations);

    const formatted = invitations
        .map((invitation) => {
            if (!invitation) return null;

            console.log("Processing invitation:", invitation);

            const organisationId =
                invitation.organisation_id ||
                invitation.public_metadata?.organisation_id ||
                null;

            const role = invitation.public_metadata?.role || "agent";

            console.log("Extracted organisation:", {
                id: organisationId,
                name: organisationLookup[organisationId],
            });

            const formattedInvitation = {
                id: invitation.id,
                firstName: "",
                lastName: "",
                name: "Pending Invitation",
                email: invitation.email_address,
                username: invitation.email_address,
                type: "invitation",
                isInvitation: true,
                organisationId,
                organisation:
                    organisationLookup[organisationId] ||
                    invitation.organisation_name ||
                    "None",
                createdAt: invitation.created_at,
                lastSignInAt: null,
                metadata: invitation.public_metadata || {},
                role,
                invitation_sent_at: invitation.created_at,
                invitation_status: invitation.status,
            };

            console.log("Formatted invitation:", formattedInvitation);
            return formattedInvitation;
        })
        .filter(Boolean);

    console.log("formatInvitations - Output:", formatted);
    return formatted;
};

/**
 * Hook for managing user table data and state
 * Combines data from useUserManagement with table-specific formatting and state
 */
export function useUsersTable(forceUpdate = 0) {
    const {
        users,
        invitations,
        organisationLookup,
        isLoading,
        error,
        refreshData,
        deleteUser,
        revokeInvitation,
    } = useSharedUsersManagement();

    // Compute formatted data directly
    const formattedData = useMemo(() => {
        console.log("Computing formatted data");
        console.log("Current users:", users);
        console.log("Current invitations:", invitations);
        console.log("Current organisationLookup:", organisationLookup);

        if (!users || !invitations || !organisationLookup) {
            console.log("Missing required data, returning empty array");
            return [];
        }

        const formattedUsers = formatUsers(users, organisationLookup);
        const formattedInvitations = formatInvitations(
            invitations,
            organisationLookup
        );

        console.log("Formatted users:", formattedUsers);
        console.log("Formatted invitations:", formattedInvitations);

        return [...formattedUsers, ...formattedInvitations];
    }, [users, invitations, organisationLookup, forceUpdate]);

    // Display state helpers
    const hasData = Boolean(formattedData?.length);
    const showLoading = isLoading && !hasData;
    const showError = Boolean(error) && !showLoading && !hasData;
    const showEmpty = !showLoading && !hasData && !showError && !isLoading;

    return {
        data: formattedData,
        isLoading,
        error,
        refreshData,
        hasData,
        showLoading,
        showError,
        showEmpty,
        organisationLookup,
        deleteUser,
        revokeInvitation,
    };
}
