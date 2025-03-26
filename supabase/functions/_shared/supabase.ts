// @ts-ignore
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { Organisation } from "./types.ts";

export function createSupabaseClient(): SupabaseClient {
    // @ts-ignore
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase environment variables");
    }

    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        global: {
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
            },
        },
    });
}

export async function getOrCreateOrganisation(
    supabase: SupabaseClient,
    name: string
): Promise<Organisation | null> {
    // First try to find existing organisation
    const { data: existingOrg, error: findError } = await supabase
        .from("organisations")
        .select("*")
        .eq("name", name)
        .single();

    if (existingOrg) {
        return existingOrg;
    }

    if (findError && findError.code !== "PGRST116") {
        // PGRST116 is "No rows returned" error, which is expected
        console.error("Error finding organisation:", findError);
        return null;
    }

    // If not found, create a new one
    const { data: newOrg, error: createError } = await supabase
        .from("organisations")
        .insert({ name })
        .select("*")
        .single();

    if (createError) {
        console.error("Error creating organisation:", createError);
        return null;
    }

    return newOrg;
}
