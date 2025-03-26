import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createSupabaseClient, getOrCreateOrganisation } from "../_shared/supabase.ts";
import { verifyUserRole } from "../_shared/auth.ts";
import { verifyClerkSession, sendClerkInvitation } from "../_shared/clerk.ts";
import {
    ErrorResponse,
    Invite,
    InviteBatchResponse,
    InviteResponse,
    PendingInvite,
    UserRole,
} from "../_shared/types.ts";

// Basic email validation
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function handleSendInvites(
    req: Request,
    authHeader: string,
    clerkSecretKey: string
): Promise<InviteBatchResponse> {
    const { invites, clerkToken } = await req.json();

    if (!invites || !Array.isArray(invites)) {
        throw new Error("Invalid request body: invites must be an array");
    }
    if (!clerkToken) {
        throw new Error("Missing Clerk token");
    }

    // Validate session
    const isValidSession = await verifyClerkSession(clerkToken, clerkSecretKey);
    if (!isValidSession) {
        throw new Error("Invalid or expired session");
    }

    // Validate emails and filter out empty ones
    const validInvites = invites.filter((invite: Invite) => {
        const email = invite.email.trim();
        return email !== "" && isValidEmail(email);
    });

    if (validInvites.length === 0) {
        throw new Error("No valid email addresses provided");
    }

    // Get the application URL from the referrer header
    const appUrl = req.headers.get("referer") || "http://localhost:5173";
    const redirectUrl = `${new URL("/sign-up", appUrl).toString()}`;

    // Send invitations
    const results = await Promise.all(
        validInvites.map(async (invite: Invite) => {
            try {
                const result = await sendClerkInvitation(
                    invite,
                    clerkSecretKey,
                    redirectUrl
                );
                return {
                    success: result.success,
                    error: result.error,
                    invite: result.success ? invite : undefined,
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message || "Failed to send invitation",
                    invite,
                };
            }
        })
    );

    const totalSuccessful = results.filter((r) => r.success).length;
    return {
        results,
        totalSuccessful,
        totalFailed: results.length - totalSuccessful,
    };
}

async function handleRevokeInvite(
    req: Request,
    clerkSecretKey: string
): Promise<InviteResponse> {
    const { inviteId } = await req.json();

    if (!inviteId) {
        throw new Error("Missing invite ID");
    }

    console.log(`Revoking invite with ID: ${inviteId}`);

    // Using the correct Clerk API endpoint for revoking invitations
    const response = await fetch(
        `https://api.clerk.dev/v1/invitations/${inviteId}/revoke`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${clerkSecretKey}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to revoke invite: ${error}`);
    }

    return { success: true };
}

async function handleGetPendingInvites(
    req: Request,
    clerkSecretKey: string
): Promise<PendingInvite[]> {
    const response = await fetch("https://api.clerk.com/v1/invitations", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch pending invites: ${error}`);
    }

    const invites = await response.json();
    return invites.filter(
        (invite: PendingInvite) => invite.status === "pending"
    );
}

// @ts-ignore
Deno.serve(async (req: Request) => {
    // Log request information
    console.log(`Received ${req.method} request to ${new URL(req.url).pathname}`);
    
    // Safely log headers
    const headerObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        headerObj[key] = key.toLowerCase().includes('auth') ? `${value.substring(0, 10)}...` : value;
    });
    console.log("Request headers:", headerObj);
    
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) {
        console.log("Responding with CORS preflight response");
        return corsResponse;
    }

    try {
        // Create Supabase client for role verification
        const supabase = createSupabaseClient();

        // Verify user role (only admin/manager can manage invites)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }

        await verifyUserRole(authHeader, supabase, ["admin", "manager"]);

        // Get Clerk secret key
        // @ts-ignore
        const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY");
        if (!clerkSecretKey) {
            throw new Error(
                "Server configuration error: Missing Clerk secret key"
            );
        }

        let result;
        const url = new URL(req.url);

        // Route based on path and method
        switch (true) {
            case req.method === "POST" && url.pathname.endsWith("/send"):
                result = await handleSendInvites(
                    req,
                    authHeader,
                    clerkSecretKey
                );
                break;

            case req.method === "POST" &&
                (url.pathname.endsWith("/revoke") ||
                    url.pathname.endsWith("/revoke/")):
                result = await handleRevokeInvite(req, clerkSecretKey);
                break;

            case req.method === "GET" &&
                (url.pathname.endsWith("/pending") ||
                    url.pathname.endsWith("/pending/")):
                result = await handleGetPendingInvites(req, clerkSecretKey);
                break;

            default:
                throw new Error(
                    `Unsupported method ${req.method} or path ${url.pathname}`
                );
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error processing invitation request:", error);

        const errorResponse: ErrorResponse = {
            error: error.message || "Internal server error",
            details: error.stack,
            source: "invitations",
            timestamp: new Date().toISOString(),
            request: {
                method: req.method,
                path: new URL(req.url).pathname,
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: error.message.includes("Unauthorised") ? 403 : 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});