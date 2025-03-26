/**
 * Supabase table names
 */
export const TABLES = {
    QUOTES: "quotes",
    ORGANISATIONS: "organisations",
    COURSE_DETAILS: "course_detail",
    COURSE_PRICES: "course_price",
    COURSE_CAMPUS: "course_campus",
    ACCOMMODATION_TYPES: "accommodation_type",
    ROOM_SIZES: "room_size",
    ACCOMMODATION_ROOMS: "accommodation_room",
    RULES: "rules",
    FACULTIES: "faculties",
    CAMPUS: "campus",
    REGION: "region",
};

/**
 * API endpoints for Supabase Edge Functions
 */
export const EDGE_FUNCTIONS = {
    // Invitations endpoints
    INVITATIONS: {
        SEND: "invitations/send",
        REVOKE: "invitations/revoke",
        PENDING: "invitations/pending",
    },
    // User management endpoints
    MANAGE_USERS: {
        DELETE: "manage-users/users",
        GET: "manage-users/users",
        UPDATE: "manage-users/users",
    },
    // Quote calculation endpoint
    CALCULATE_QUOTE: "calculate-quote",
};

/**
 * Common API response status codes
 */
export const STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    NOT_ACCEPTABLE: 406,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};

/**
 * API request headers
 */
export const HEADERS = {
    CONTENT_TYPE: "Content-Type",
    AUTHORIZATION: "Authorization",
    ACCEPT: "Accept",
    ACCEPT_PROFILE: "Accept-Profile",
    CONTENT_PROFILE: "Content-Profile",
    PREFER: "Prefer",
};

/**
 * API header values
 */
export const HEADER_VALUES = {
    CONTENT_TYPE_JSON: "application/json",
    ACCEPT_POSTGREST: "application/vnd.pgrst.object+json",
    PROFILE_PUBLIC: "public",
    PREFER_RETURN: "return=representation",
};
