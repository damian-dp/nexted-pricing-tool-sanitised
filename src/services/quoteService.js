/**
 * Service for quote-related operations
 */
import { createSupabaseClientWithAuth } from "../utils/supabaseClient";

/**
 * Calculates a quote using the Supabase Edge Function
 * @param {Object} quoteInput - The quote input data
 * @returns {Promise<Object>} - The calculated quote
 */
export const calculateQuote = async (quoteInput) => {
    try {
        // Get a Supabase client with the user's authentication
        const supabase = await createSupabaseClientWithAuth();

        // Call the calculate-quote Edge Function
        const { data, error } = await supabase.functions.invoke(
            "calculate-quote",
            {
                body: { quoteInput },
            }
        );

        // Handle errors
        if (error) {
            console.error("Error calculating quote:", error);
            throw new Error(`Failed to calculate quote: ${error.message}`);
        }

        // Return the quote output
        return data.quote;
    } catch (error) {
        console.error("Quote calculation failed:", error);
        throw error;
    }
};

/**
 * Saves a quote to the database
 * @param {Object} quoteInput - The quote input data
 * @param {Object} quoteOutput - The calculated quote output
 * @returns {Promise<Object>} - The saved quote
 */
export const saveQuote = async (quoteInput, quoteOutput) => {
    try {
        // Get a Supabase client with the user's authentication
        const supabase = await createSupabaseClientWithAuth();

        // Prepare the quote data
        const quoteData = {
            quote_input: quoteInput,
            quote_output: quoteOutput,
            total_price: quoteOutput.total_price,
            student_name: `${quoteInput.student_details.firstName} ${quoteInput.student_details.lastName}`,
            student_email: quoteInput.student_details.email,
            created_at: new Date().toISOString(),
            // The clerk_id will be automatically set by RLS policies
        };

        // Insert the quote into the database
        const { data, error } = await supabase
            .from("quotes")
            .insert(quoteData)
            .select()
            .single();

        // Handle errors
        if (error) {
            console.error("Error saving quote:", error);
            throw new Error(`Failed to save quote: ${error.message}`);
        }

        // Return the saved quote
        return data;
    } catch (error) {
        console.error("Quote saving failed:", error);
        throw error;
    }
};

/**
 * Gets a list of quotes for the current user
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of quotes to return
 * @param {number} options.offset - Number of quotes to skip
 * @returns {Promise<Array>} - The list of quotes
 */
export const getQuotes = async (options = { limit: 10, offset: 0 }) => {
    try {
        // Get a Supabase client with the user's authentication
        const supabase = await createSupabaseClientWithAuth();

        // Query the quotes table
        const { data, error } = await supabase
            .from("quotes")
            .select("*")
            .order("created_at", { ascending: false })
            .range(options.offset, options.offset + options.limit - 1);

        // Handle errors
        if (error) {
            console.error("Error fetching quotes:", error);
            throw new Error(`Failed to fetch quotes: ${error.message}`);
        }

        // Return the quotes
        return data;
    } catch (error) {
        console.error("Quote fetching failed:", error);
        throw error;
    }
};

/**
 * Gets a single quote by ID
 * @param {string} quoteId - The ID of the quote to get
 * @returns {Promise<Object>} - The quote
 */
export const getQuoteById = async (quoteId) => {
    try {
        // Get a Supabase client with the user's authentication
        const supabase = await createSupabaseClientWithAuth();

        // Query the quotes table
        const { data, error } = await supabase
            .from("quotes")
            .select("*")
            .eq("id", quoteId)
            .single();

        // Handle errors
        if (error) {
            console.error(`Error fetching quote ${quoteId}:`, error);
            throw new Error(`Failed to fetch quote: ${error.message}`);
        }

        // Return the quote
        return data;
    } catch (error) {
        console.error(`Quote fetching failed for ID ${quoteId}:`, error);
        throw error;
    }
};
