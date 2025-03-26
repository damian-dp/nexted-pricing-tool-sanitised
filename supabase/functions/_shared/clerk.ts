import { Invite } from "./types.ts";

export async function verifyClerkSession(
    sessionId: string,
    clerkSecretKey: string
): Promise<boolean> {
    const response = await fetch(
        `https://api.clerk.com/v1/sessions/${encodeURIComponent(sessionId)}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${clerkSecretKey}`,
                "Content-Type": "application/json",
            },
        }
    );

    const responseText = await response.text();
    console.log("Raw session verification response:", responseText);

    if (!response.ok) {
        console.error("Session verification failed:", {
            status: response.status,
            text: responseText,
        });
        return false;
    }

    try {
        const sessionData = JSON.parse(responseText);
        return sessionData.status === "active";
    } catch (error) {
        console.error("Failed to parse session response:", error);
        return false;
    }
}

export async function sendClerkInvitation(
    invite: Invite,
    clerkSecretKey: string,
    redirectUrl: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch("https://api.clerk.com/v1/invitations", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${clerkSecretKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email_address: invite.email.trim(),
                public_metadata: {
                    role: invite.role,
                    organisation_id: invite.organisation,
                },
                redirect_url: redirectUrl,
                notify: true,
            }),
        });

        const responseText = await response.text();
        console.log(
            `Raw invitation response for ${invite.email}:`,
            responseText
        );

        if (!response.ok) {
            const errorData = JSON.parse(responseText);
            return {
                success: false,
                error:
                    errorData.errors?.[0]?.message ||
                    `Failed with status ${response.status}`,
            };
        }

        return { success: true };
    } catch (error) {
        console.error(`Error sending invitation to ${invite.email}:`, error);
        return {
            success: false,
            error: error.message || "Unknown error occurred",
        };
    }
}
