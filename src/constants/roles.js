/**
 * User role constants
 */
export const USER_ROLES = {
    ADMIN: "admin",
    MANAGER: "manager",
    AGENT: "agent",
};

/**
 * Display labels for user roles
 */
export const ROLE_LABELS = {
    [USER_ROLES.ADMIN]: "Admin",
    [USER_ROLES.MANAGER]: "Manager",
    [USER_ROLES.AGENT]: "Agent",
};

/**
 * Role hierarchy and permissions
 */
export const ROLE_HIERARCHY = {
    [USER_ROLES.ADMIN]: [
        USER_ROLES.ADMIN,
        USER_ROLES.MANAGER,
        USER_ROLES.AGENT,
    ],
    [USER_ROLES.MANAGER]: [USER_ROLES.AGENT],
    [USER_ROLES.AGENT]: [],
};

/**
 * Role-based capabilities
 */
export const ROLE_CAPABILITIES = {
    [USER_ROLES.ADMIN]: {
        // Invite Management
        canInviteAdmins: true,
        canInviteManagers: true,
        canInviteAgents: true,

        // Profile Viewing
        canManageOrganisations: true,
        canViewAdminProfiles: true,
        canViewManagerProfiles: true,
        canViewAgentProfiles: true,

        // Profile Modification
        canModifyAdminProfiles: true,
        canModifyManagerProfiles: true,
        canModifyAgentProfiles: true,

        // Role Modification
        canModifyAdminRoles: true,
        canModifyManagerRoles: true,
        canModifyAgentRoles: true,
        canModifyOwnRole: true,

        // Profile Deletion
        canDeleteAdmins: true,
        canDeleteManagers: true,
        canDeleteAgents: true,

        // Quote Management
        canViewAllQuotes: true,
    },

    [USER_ROLES.MANAGER]: {
        // Invite Management
        canInviteAdmins: false,
        canInviteManagers: true,
        canInviteAgents: true,

        // Profile Viewing
        canManageOrganisations: true,
        canViewAdminProfiles: true,
        canViewManagerProfiles: true,
        canViewAgentProfiles: true,

        // Profile Modification
        canModifyAdminProfiles: false,
        canModifyManagerProfiles: false,
        canModifyAgentProfiles: true,

        // Role Modification
        canModifyAdminRoles: false,
        canModifyManagerRoles: false,
        canModifyAgentRoles: true,
        canModifyOwnRole: true,

        // Profile Deletion
        canDeleteAdmins: false,
        canDeleteManagers: false,
        canDeleteAgents: true,

        // Quote Management
        canViewAllQuotes: true,
    },

    [USER_ROLES.AGENT]: {
        // Invite Management
        canInviteAdmins: false,
        canInviteManagers: false,
        canInviteAgents: false,

        // Profile Viewing
        canManageOrganisations: false,
        canViewAdminProfiles: false,
        canViewManagerProfiles: false,
        canViewAgentProfiles: false,

        // Profile Modification
        canModifyAdminProfiles: false,
        canModifyManagerProfiles: false,
        canModifyAgentProfiles: false,

        // Role Modification
        canModifyAdminRoles: false,
        canModifyManagerRoles: false,
        canModifyAgentRoles: false,
        canModifyOwnRole: false,

        // Profile Deletion
        canDeleteAdmins: false,
        canDeleteManagers: false,
        canDeleteAgents: false,

        // Quote Management
        canViewAllQuotes: false,
    },
};
