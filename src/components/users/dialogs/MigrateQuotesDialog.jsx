import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LoaderCircleIcon } from "lucide-react";
import { createClerkSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@clerk/clerk-react";

export function MigrateQuotesDialog({
    open,
    onOpenChange,
    usersToDelete,
    availableUsers,
    onConfirm,
}) {
    const [targetUserId, setTargetUserId] = useState("");
    const [quoteCounts, setQuoteCounts] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isMigrating, setIsMigrating] = useState(false);
    const { getToken } = useAuth();

    // Fetch quote counts for users being deleted
    useEffect(() => {
        async function fetchQuoteCounts() {
            if (!open || !usersToDelete?.length) return;

            try {
                setIsLoading(true);
                const token = await getToken({ template: "supabase" });
                if (!token) throw new Error("No authentication token received");

                const supabase = createClerkSupabaseClient(token);

                // Use a simpler query approach with count
                const counts = {};
                for (const user of usersToDelete) {
                    const { count, error } = await supabase
                        .from("quotes")
                        .select("*", { count: "exact", head: true })
                        .eq("user_id", user.id);

                    if (error) throw error;
                    counts[user.id] = count || 0;
                }

                setQuoteCounts(counts);
            } catch (err) {
                console.error("Error fetching quote counts:", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchQuoteCounts();
    }, [open, usersToDelete, getToken]);

    const handleConfirm = async () => {
        if (!targetUserId) return;

        try {
            setIsMigrating(true);
            const token = await getToken({ template: "supabase" });
            if (!token) throw new Error("No authentication token received");

            const supabase = createClerkSupabaseClient(token);

            // Migrate quotes using the migrate_user_quotes function
            const { data: migrationResult, error: migrationError } =
                await supabase.rpc("migrate_user_quotes", {
                    source_user_ids: usersToDelete.map((u) => u.id),
                    target_user_id: targetUserId,
                });

            if (migrationError) throw migrationError;

            // Call the onConfirm callback with the migration result
            await onConfirm(targetUserId, migrationResult);
        } catch (err) {
            console.error("Error migrating quotes:", err);
            throw err;
        } finally {
            setIsMigrating(false);
        }
    };

    const totalQuotes = Object.values(quoteCounts).reduce((a, b) => a + b, 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Migrate Quotes Before Deletion</DialogTitle>
                    <DialogDescription>
                        {isLoading ? (
                            "Loading quote information..."
                        ) : (
                            <>
                                {totalQuotes} quotes from{" "}
                                {usersToDelete?.length} users need to be
                                migrated before deletion. Please select a user
                                to migrate these quotes to.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {!isLoading && (
                    <div className="space-y-4">
                        {usersToDelete?.map((user) => (
                            <div
                                key={user.id}
                                className="flex justify-between items-center"
                            >
                                <span>
                                    {user.first_name} {user.last_name}
                                </span>
                                <span className="text-muted-foreground">
                                    {quoteCounts[user.id] || 0} quotes
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Select
                            value={targetUserId}
                            onValueChange={setTargetUserId}
                            disabled={isLoading || isMigrating}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a user to migrate quotes to" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableUsers
                                    ?.filter(
                                        (u) =>
                                            !usersToDelete.find(
                                                (du) => du.id === u.id
                                            )
                                    )
                                    .map((user) => (
                                        <SelectItem
                                            key={user.id}
                                            value={user.id}
                                        >
                                            {user.first_name} {user.last_name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isMigrating}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!targetUserId || isLoading || isMigrating}
                    >
                        {isMigrating && (
                            <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isMigrating ? "Migrating..." : "Migrate and Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
