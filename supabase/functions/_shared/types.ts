export type UserRole = "agent" | "manager" | "admin" | "authenticated";

export interface Invite {
    email: string;
    role: UserRole;
    organisation: string;
}

export interface User {
    id: string;
    clerk_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    role: UserRole;
    organisation_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface Organisation {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface WebhookPayload {
    type: string;
    data: Record<string, any>;
}

export interface ErrorResponse {
    error: string;
    details?: unknown;
    source?: string;
    timestamp?: string;
    request?: {
        method: string;
        path: string;
    };
}

// Invitation related types
export interface InviteResponse {
    success: boolean;
    error?: string;
    invite?: Invite;
}

export interface PendingInvite {
    id: string;
    email_address: string;
    public_metadata: {
        role: UserRole;
        organisation_id: string;
    };
    created_at: string;
    updated_at: string;
    status: "pending" | "accepted" | "expired";
}

export interface InviteBatchResponse {
    results: InviteResponse[];
    totalSuccessful: number;
    totalFailed: number;
}

// User management related types
export interface UserDeleteResponse {
    success: boolean;
    error?: string;
    userId?: string;
}

export interface WebhookResponse {
    success: boolean;
    error?: string;
    action?: string;
}

// Quote calculation related types
export interface QuoteRequest {
    // Add quote request fields based on your quote calculator needs
    [key: string]: any;
}

export interface QuoteResponse {
    success: boolean;
    error?: string;
    quote?: {
        total: number;
        breakdown: Record<string, number>;
        [key: string]: any;
    };
}
