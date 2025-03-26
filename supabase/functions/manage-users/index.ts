import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";
import { verifyUserRole } from "../_shared/auth.ts";
import {
    UserRole,
    UserDeleteResponse,
    ErrorResponse,
} from "../_shared/types.ts";

// Debug environment variables
console.log("Environment check:");
console.log(
    "SUPABASE_URL:",
    // @ts-ignore
    Deno.env.get("SUPABASE_URL")?.substring(0, 10) + "..."
);
console.log(
    "SUPABASE_SERVICE_ROLE_KEY:",
    // @ts-ignore
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.substring(0, 10) + "..."
);

async function handleDeleteUser(
    body: { userId: string },
    clerkSecretKey: string
): Promise<UserDeleteResponse> {
    const { userId } = body;
    const logs: string[] = [];

    const log = (message: string) => {
        console.log(message);
        logs.push(message);
    };

    if (!userId) {
        throw new Error("Missing user ID");
    }

    // Delete user from Clerk
    const clerkResponse = await fetch(
        `https://api.clerk.com/v1/users/${userId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${clerkSecretKey}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!clerkResponse.ok) {
        const clerkErrorText = await clerkResponse.text();
        log(`Error deleting user from Clerk: ${clerkErrorText}`);
        throw new Error(
            `Failed to delete user from Clerk: ${clerkResponse.statusText}`
        );
    }

    log(`Successfully deleted user ${userId} from Clerk`);
    return {
        success: true,
        userId,
    };
}

/**
 * Update user metadata in Clerk
 */
interface UpdateUserRequest {
    userId: string;
    data: {
        role?: UserRole;
        organisation_id?: string;
        first_name?: string;
        last_name?: string;
        [key: string]: any;
    };
}

interface UpdateUserResponse {
    success: boolean;
    userId: string;
    updatedData?: any;
    error?: string;
}

async function handleUpdateUser(
    body: UpdateUserRequest,
    clerkSecretKey: string
): Promise<UpdateUserResponse> {
    const { userId, data } = body;
    console.log(`Updating user ${userId} with data:`, data);

    if (!userId) {
        throw new Error("Missing user ID");
    }

    if (!data || Object.keys(data).length === 0) {
        throw new Error("No update data provided");
    }

    try {
        // First fetch the current user to get existing metadata
        console.log(`Fetching current user ${userId} to preserve metadata`);
        const getUserResponse = await fetch(
            `https://api.clerk.com/v1/users/${userId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${clerkSecretKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!getUserResponse.ok) {
            const errorText = await getUserResponse.text();
            console.error(`Error fetching user from Clerk: ${errorText}`);
            throw new Error(
                `Failed to fetch user: ${getUserResponse.status} ${getUserResponse.statusText}`
            );
        }

        const currentUser = await getUserResponse.json();
        console.log(`Successfully fetched user ${userId} from Clerk`);

        // IMPORTANT: Clerk REST API uses snake_case for the metadata keys
        // but their SDKs use camelCase. We need to use snake_case for direct API calls.
        const updateData: any = {};

        // Handle direct user properties
        if (data.first_name !== undefined) {
            updateData.first_name = data.first_name;
        }

        if (data.last_name !== undefined) {
            updateData.last_name = data.last_name;
        }

        // Start with existing public_metadata (if any)
        const existingPublicMetadata = currentUser.public_metadata || {};
        const publicMetadata: Record<string, any> = {
            ...existingPublicMetadata,
        };

        // Update metadata fields provided in the request
        if (data.role !== undefined) {
            console.log(
                "Role value:",
                data.role,
                "Type:",
                typeof data.role,
                "Normalized to lowercase:",
                String(data.role).toLowerCase()
            );
            publicMetadata.role = String(data.role).toLowerCase();
        }

        if (data.organisation_id !== undefined) {
            publicMetadata.organisation_id = data.organisation_id;
        }

        // Add any other remaining fields to metadata
        Object.entries(data).forEach(([key, value]) => {
            if (
                key !== "role" &&
                key !== "organisation_id" &&
                key !== "first_name" &&
                key !== "last_name"
            ) {
                publicMetadata[key] = value;
            }
        });

        // Only add public_metadata if we have values
        if (Object.keys(publicMetadata).length > 0) {
            updateData.public_metadata = publicMetadata; // Note snake_case for API
        }

        console.log(
            "Final update data for Clerk API:",
            JSON.stringify(updateData, null, 2)
        );

        // Update user in Clerk
        const clerkResponse = await fetch(
            `https://api.clerk.com/v1/users/${userId}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${clerkSecretKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            }
        );

        if (!clerkResponse.ok) {
            const errorText = await clerkResponse.text();
            console.error(`Error updating user in Clerk: ${errorText}`);
            throw new Error(
                `Failed to update user: ${clerkResponse.status} ${clerkResponse.statusText}`
            );
        }

        const updatedUser = await clerkResponse.json();
        console.log(`Successfully updated user ${userId} in Clerk`);

        return {
            success: true,
            userId,
            updatedData: updatedUser,
        };
    } catch (error) {
        console.error(`Error in handleUpdateUser:`, error);
        throw error;
    }
}

/**
 * Get users from Clerk API
 */
async function handleGetUsers(clerkSecretKey: string): Promise<any> {
    try {
        console.log("Fetching users from Clerk API");

        // Call Clerk API to get all users - paginated with limit of 100
        const response = await fetch(
            "https://api.clerk.com/v1/users?limit=100",
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${clerkSecretKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error fetching users from Clerk:", errorText);
            throw new Error(
                `Failed to fetch users: ${response.status} ${response.statusText}`
            );
        }

        // Parse the response as JSON
        const usersResponse = await response.json();

        // Check if the response is an array-like object by looking for numeric keys
        const hasNumericKeys = Object.keys(usersResponse).some(
            (key) => !isNaN(parseInt(key))
        );

        let usersList: any[] = [];

        if (Array.isArray(usersResponse)) {
            // If it's already an array, use it directly
            usersList = usersResponse;
        } else if (usersResponse.data && Array.isArray(usersResponse.data)) {
            // If it has a data property that's an array, use that
            usersList = usersResponse.data;
        } else if (hasNumericKeys) {
            // If it's an array-like object with numeric keys, convert to array
            usersList = Object.values(usersResponse);
        } else {
            // If we can't determine the format, log the structure and return empty array
            console.log(
                "Could not determine user list format, response keys:",
                Object.keys(usersResponse)
            );
        }

        // Map users to standardized format - Clerk API uses snake_case but some frontends expect camelCase
        const standardizedUsers = await Promise.all(
            usersList.map(async (user) => {
                // Get primary email if available
                let primaryEmail = "";

                if (
                    user.primary_email_address_id &&
                    (!user.email_addresses || !user.email_addresses.length)
                ) {
                    // If we have a primary email ID but no email addresses, try to fetch them
                    try {
                        const emailResponse = await fetch(
                            `https://api.clerk.com/v1/email_addresses/${user.primary_email_address_id}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${clerkSecretKey}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );

                        if (emailResponse.ok) {
                            const emailData = await emailResponse.json();
                            primaryEmail = emailData.email_address;

                            // Structure email addresses array to match what frontend expects
                            user.email_addresses = [
                                {
                                    id: emailData.id,
                                    emailAddress: emailData.email_address,
                                },
                            ];
                        } else {
                            console.log(
                                `Failed to fetch email for ${user.id}: ${emailResponse.status}`
                            );
                        }
                    } catch (error) {
                        console.error(
                            `Error fetching email for user ${user.id}:`,
                            error
                        );
                    }
                } else if (
                    user.email_addresses &&
                    Array.isArray(user.email_addresses) &&
                    user.email_addresses.length > 0
                ) {
                    // Find primary email or use first one
                    const primary =
                        user.email_addresses.find(
                            (email: any) =>
                                email.id === user.primary_email_address_id
                        ) || user.email_addresses[0];

                    if (primary && primary.email_address) {
                        primaryEmail = primary.email_address;

                        // Make sure email_addresses items have the emailAddress property for frontend compatibility
                        user.email_addresses = user.email_addresses.map(
                            (email: any) => ({
                                ...email,
                                emailAddress:
                                    email.emailAddress || email.email_address,
                            })
                        );
                    }
                }

                // Get public metadata
                const publicMetadata =
                    user.public_metadata || user.publicMetadata || {};

                // Format timestamp for last login - accept various formats
                const lastSignIn = user.last_sign_in_at || user.lastSignInAt;
                let formattedLastSignIn = null;

                if (lastSignIn) {
                    try {
                        formattedLastSignIn = new Date(
                            lastSignIn
                        ).toISOString();
                    } catch (e) {
                        console.error(
                            `Error parsing last_sign_in_at: ${lastSignIn}`,
                            e
                        );
                    }
                }

                return {
                    id: user.id,
                    firstName: user.first_name || user.firstName || "",
                    lastName: user.last_name || user.lastName || "",
                    email: primaryEmail,
                    emailAddresses:
                        user.email_addresses || user.emailAddresses || [],
                    imageUrl:
                        user.image_url ||
                        user.imageUrl ||
                        user.profile_image_url ||
                        "",
                    publicMetadata: publicMetadata,
                    // Map all metadata properties to the root level for easier access
                    role: publicMetadata.role || "authenticated",
                    organisation_id: publicMetadata.organisation_id || "",
                    // Format timestamps for client side
                    createdAt: user.created_at || user.createdAt,
                    lastSignInAt: formattedLastSignIn,
                    status: formattedLastSignIn ? "active" : "inactive",
                    // Include original properties
                    ...user,
                };
            })
        );

        // Map the user data to match the exact format expected by the frontend
        const frontendFormattedUsers = standardizedUsers.map((user) => {
            // Email addresses may be an array of objects with emailAddress property (not email_address)
            const emailAddresses = (user.email_addresses || []).map(
                (email: any) => ({
                    id: email.id,
                    emailAddress: email.emailAddress || email.email_address,
                })
            );

            return {
                id: user.id,
                clerk_id: user.id,
                // Match the exact property names used in the frontend useUsers.js
                firstName: user.firstName || user.first_name || "",
                lastName: user.lastName || user.last_name || "",
                // Set the full name property
                name: `${user.firstName || user.first_name || ""} ${
                    user.lastName || user.last_name || ""
                }`.trim(),
                // Email must match emailAddresses[0].emailAddress structure
                email: emailAddresses[0]?.emailAddress || user.email || "",
                emailAddresses: emailAddresses,
                // Public metadata
                publicMetadata:
                    user.publicMetadata || user.public_metadata || {},
                // Role information
                role:
                    user.role ||
                    user.publicMetadata?.role ||
                    user.public_metadata?.role ||
                    "authenticated",
                // Organisation info
                organisation_id:
                    user.organisation_id ||
                    user.publicMetadata?.organisation_id ||
                    user.public_metadata?.organisation_id ||
                    "",
                // Status flags
                is_active: user.is_active !== false, // Default to true if not specified
                // Timestamps - ensure we have both camelCase and snake_case versions
                createdAt: user.created_at || user.createdAt,
                created_at: user.created_at || user.createdAt,
                updatedAt: user.updated_at || user.updatedAt,
                updated_at: user.updated_at || user.updatedAt,
            };
        });

        console.log(
            `Successfully processed ${frontendFormattedUsers.length} users from Clerk`
        );

        // Return the frontend formatted user list
        return frontendFormattedUsers;
    } catch (error) {
        console.error("Error in handleGetUsers:", error);
        throw error;
    }
}

// @ts-ignore
Deno.serve(async (req: Request) => {
    // Log request information
    console.log(
        `Received ${req.method} request to ${new URL(req.url).pathname}`
    );

    // Safely log headers
    const headerObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        headerObj[key] = key.toLowerCase().includes("auth")
            ? `${value.substring(0, 10)}...`
            : value;
    });
    console.log("Request headers:", headerObj);

    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) {
        console.log("Responding with CORS preflight response");
        return corsResponse;
    }

    try {
        const supabase = createSupabaseClient();
        const url = new URL(req.url);

        // For all requests, verify user role
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }

        // Only admins and managers can update users
        // Only admins can delete users
        // Anyone with a role can view users
        let allowedRoles: UserRole[];
        if (req.method === "DELETE") {
            allowedRoles = ["admin"];
        } else if (req.method === "PATCH" || req.method === "PUT") {
            allowedRoles = ["admin", "manager"];
        } else {
            // For GET requests, allow any authenticated user
            allowedRoles = ["admin", "manager", "agent", "authenticated"];
        }

        try {
            await verifyUserRole(authHeader, supabase, allowedRoles);
            console.log(
                "User role verification passed for",
                req.method,
                "request"
            );
        } catch (error) {
            console.error("User role verification failed:", error.message);
            throw new Error(`Unauthorized: ${error.message}`);
        }

        // Get Clerk secret key for user operations
        // @ts-ignore
        const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY");
        if (!clerkSecretKey) {
            throw new Error(
                "Server configuration error: Missing Clerk secret key"
            );
        }

        let result;
        // Route based on path and method
        if (req.method === "DELETE" && url.pathname.endsWith("/users")) {
            const body = await req.json();
            result = await handleDeleteUser(body, clerkSecretKey);
        } else if (req.method === "GET" && url.pathname.endsWith("/users")) {
            result = await handleGetUsers(clerkSecretKey);
        } else if (
            (req.method === "PATCH" || req.method === "PUT") &&
            url.pathname.endsWith("/users")
        ) {
            const body = await req.json();
            result = await handleUpdateUser(body, clerkSecretKey);
        } else {
            throw new Error(
                `Unsupported method ${req.method} or path ${url.pathname}`
            );
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error processing user management request:", error);

        const errorResponse: ErrorResponse = {
            error: error.message || "Internal server error",
            details: error.stack,
            source: "manage-users",
            timestamp: new Date().toISOString(),
            request: {
                method: req.method,
                path: new URL(req.url).pathname,
            },
        };

        return new Response(JSON.stringify(errorResponse), {
            status: error.message.includes("Unauthorised") ? 403 : 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});