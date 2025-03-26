import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";
import { verifyUserRole } from "../_shared/auth.ts";
import { evaluateRuleConditions } from "../_shared/rule-evaluator.ts";
import {
    calculateFinalQuote,
    QuoteInput,
    QuoteOutput,
    Rule,
    CoursePrice,
    AccommodationRoom,
} from "../_shared/quote-calculator.ts";
import {
    QuoteRequest,
    QuoteResponse,
    ErrorResponse,
} from "../_shared/types.ts";

async function fetchQuoteData(supabase: any) {
    const [rulesResponse, coursePricesResponse, accommodationRoomsResponse] =
        await Promise.all([
            supabase
                .from("rules")
                .select("*")
                .lte("start_date", new Date().toISOString())
                .or(
                    `end_date.is.null,end_date.gte.${new Date().toISOString()}`
                ),
            supabase.from("course_price").select("*"),
            supabase.from("accommodation_room").select("*"),
        ]);

    // Check for errors in any of the database queries
    const errors = [
        rulesResponse.error,
        coursePricesResponse.error,
        accommodationRoomsResponse.error,
    ].filter(Boolean);

    if (errors.length > 0) {
        console.error("Database query errors:", errors);
        throw new Error("Error fetching data from database");
    }

    return {
        rules: rulesResponse.data as Rule[],
        coursePrices: coursePricesResponse.data as CoursePrice[],
        accommodationRooms:
            accommodationRoomsResponse.data as AccommodationRoom[],
    };
}

function validateQuoteInput(quoteInput: QuoteInput): void {
    if (
        !quoteInput ||
        !quoteInput.student_details ||
        !quoteInput.course_details
    ) {
        throw new Error("Invalid input data: missing required fields");
    }
}

// @ts-ignore
Deno.serve(async (req: Request) => {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        // Only accept POST requests
        if (req.method !== "POST") {
            const error: ErrorResponse = { error: "Method not allowed" };
            return new Response(JSON.stringify(error), {
                status: 405,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Create Supabase client
        const supabase = createSupabaseClient();

        // Verify user role (all roles can calculate quotes)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }

        await verifyUserRole(authHeader, supabase, [
            "admin",
            "manager",
            "agent",
        ]);

        // Parse and validate request
        const { quoteInput } = (await req.json()) as QuoteRequest;
        validateQuoteInput(quoteInput);

        // Fetch all necessary data
        const { rules, coursePrices, accommodationRooms } =
            await fetchQuoteData(supabase);

        // Calculate quote
        const quote = calculateFinalQuote(
            quoteInput,
            rules,
            coursePrices,
            accommodationRooms
        );

        // Return response
        const response: QuoteResponse = { success: true, quote };
        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error processing quote request:", error);

        const errorResponse: ErrorResponse = {
            error: error.message || "Internal server error",
            details: error.stack,
        };

        return new Response(JSON.stringify(errorResponse), {
            status: error.message.includes("Unauthorised") ? 403 : 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
