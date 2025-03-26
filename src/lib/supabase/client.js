import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
}

// Global configuration for supabase client
const supabaseOptions = {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
};

// Create a single global Supabase client (without auth)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    ...supabaseOptions,
    global: {
        headers: {
            "Content-Type": "application/json",
        },
    },
});

// Cache for Supabase clients by token
const clientCache = {};

/**
 * Get a singleton Supabase client for the given token
 * This ensures we only create one client per token
 */
export function getSupabaseClient(token) {
    // Return cached client if it exists for this token
    if (clientCache[token]) {
        return clientCache[token];
    }

    // Create and cache a new client if none exists
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            "Supabase URL and anon key must be defined in environment variables"
        );
    }

    const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });

    // Cache the client for this token
    clientCache[token] = client;
    return client;
}

/**
 * Basic unauthenticated client (if needed)
 * @returns {object} Unauthenticated Supabase client
 */
export function getUnauthenticatedClient() {
    return supabaseClient;
}

// For backward compatibility
export const supabase = getUnauthenticatedClient(); 