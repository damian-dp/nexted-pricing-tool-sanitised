import { useAuth } from "@clerk/clerk-react";
import { getSupabaseClient } from "./client";

/**
 * Create a Supabase client with the Clerk token
 * This is a wrapper around getSupabaseClient that gets the token from Clerk
 */
export async function createClerkSupabaseClient(getToken) {
    try {
        if (typeof getToken !== "function") {
            throw new Error("getToken must be a function");
        }

        const token = await getToken({ template: "supabase" });
        if (!token) {
            throw new Error("No token available from Clerk");
        }

        return getSupabaseClient(token);
    } catch (error) {
        throw new Error(`Failed to create Supabase client: ${error.message}`);
    }
}

/**
 * Returns a custom hook to work with Supabase using Clerk authentication
 * @returns {function} Hook to access Supabase client with Clerk token
 */
export function useSupabaseClient() {
    const { getToken } = useAuth();

    return async () => {
        try {
            return createClerkSupabaseClient(getToken);
        } catch (error) {
            console.error("Error getting Supabase client:", error);
            return null;
        }
    };
}

/**
 * Convenience hook that executes a Supabase query with the Clerk token
 * @param {function} queryFn - Function that takes a Supabase client and returns a query
 * @returns {Promise<Object>} Query result (data and error)
 */
export function useSupabaseQuery() {
    const getSupabase = useSupabaseClient();

    return async (queryFn) => {
        try {
            const client = await getSupabase();
            if (!client) {
                throw new Error("No Supabase client available");
            }
            return await queryFn(client);
        } catch (error) {
            console.error("Error executing Supabase query:", error);
            return { data: null, error };
        }
    };
}
