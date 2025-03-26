// @ts-ignore
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
// @ts-ignore
import { Webhook } from "npm:svix@1.16";

// Define UserRole type that includes "authenticated"
export type UserRole = "admin" | "manager" | "agent" | "authenticated";

export async function verifyUserRole(
    authHeader: string,
    supabase: SupabaseClient,
    allowedRoles: UserRole[]
): Promise<{ role: UserRole; clerk_id: string }> {
    try {
        // Extract the token
        const token = authHeader.replace("Bearer ", "");

        // Decode the JWT token (we only need the payload)
        const [, payloadBase64] = token.split(".");
        const payload = JSON.parse(atob(payloadBase64));
        const clerkUserId = payload.sub;

        if (!clerkUserId) {
            throw new Error("Invalid token: no user ID found");
        }

        console.log("Clerk user ID from token:", clerkUserId);
        
        // ONLY get role from public_metadata - never check other metadata fields
        let userRole: UserRole | null = null;
        
        // Log all metadata fields for debugging
        console.log("Token payload metadata:", {
            public_metadata: payload.public_metadata,
            app_metadata: payload.app_metadata,
            metadata: payload.metadata,
            user_metadata: payload.user_metadata
        });
        
        // ONLY check in publicMetadata, never elsewhere
        if (payload.public_metadata && payload.public_metadata.role) {
            userRole = String(payload.public_metadata.role).toLowerCase() as UserRole;
            console.log("Found role in public_metadata:", userRole);
        } else {
            console.log("Role not found in public_metadata");
            throw new Error("User role not found in public_metadata. Make sure to set the role in Clerk's publicMetadata.");
        }

        // Check if user's role is allowed
        if (!allowedRoles.includes(userRole)) {
            console.log(`Role '${userRole}' is not in allowed roles:`, allowedRoles);
            throw new Error(`Unauthorised role: ${userRole}. Required: ${allowedRoles.join(', ')}`);
        }

        return { role: userRole, clerk_id: clerkUserId };
    } catch (error) {
        console.error("Token verification error:", error);
        throw error;
    }
}

export async function verifyWebhookSignature(
    req: Request
): Promise<{ type: string; data: any }> {
    try {
        const payload = await req.json();
        // @ts-ignore
        const headers = Object.fromEntries(req.headers);

        console.log("Webhook Headers:", headers);
        console.log("Webhook Payload:", payload);

        // Get webhook secret from environment
        // @ts-ignore
        const webhookSecret = Deno.env.get("CLERK_WEBHOOK_SECRET");
        if (!webhookSecret) {
            throw new Error("Clerk webhook secret not configured");
        }

        // Create a new instance of the Webhook class
        const wh = new Webhook(webhookSecret);

        // Verify the signature
        try {
            // svix-id, svix-timestamp, svix-signature
            const signatureHeader = headers["svix-signature"];
            if (!signatureHeader) {
                throw new Error("No svix-signature header found");
            }

            const jsonPayload = JSON.stringify(payload);
            wh.verify(jsonPayload, {
                "svix-id": headers["svix-id"],
                "svix-timestamp": headers["svix-timestamp"],
                "svix-signature": signatureHeader,
            });
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            throw new Error(`Webhook verification failed: ${err.message}`);
        }

        return payload;
    } catch (error) {
        console.error("Error verifying webhook:", error);
        throw error;
    }
}
