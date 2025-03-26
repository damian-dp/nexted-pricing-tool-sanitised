export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, x-clerk-user-id, content-type, accept, accept-profile, content-profile, prefer",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
};

export function handleCors(req: Request): Response | null {
    // Handle preflight requests (OPTIONS)
    if (req.method === "OPTIONS") {
        console.log("Handling OPTIONS preflight request");
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }
    return null;
}
