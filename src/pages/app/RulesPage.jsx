import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, PlusIcon } from "lucide-react";
import { CreateRuleDialog } from "@/components/rules/dialogs/CreateRuleDialog";
import { RulesTable } from "@/components/rules/tables/RulesTable";
import { useRulesTable } from "@/hooks/useRulesTable";

const RULE_TYPES = {
    PRICING: "PRICING",
    FEE: "FEE",
    DISCOUNT: "DISCOUNT",
};

export function RulesPage() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const {
        rules,
        isLoading,
        showEmpty,
        showError,
        fetchRules,
        createRule,
        updateRule,
        deleteRules,
    } = useRulesTable();

    // Initial fetch only
    useEffect(() => {
        const initialFetch = async () => {
            try {
                await fetchRules();
            } catch (error) {
                console.error("Initial fetch failed:", error);
            }
        };
        initialFetch();
    }, []); // Empty dependency array for initial fetch only

    // Manual refresh handler
    const handleRefresh = useCallback(async () => {
        try {
            await fetchRules();
        } catch (error) {
            console.error("Manual refresh failed:", error);
        }
    }, [fetchRules]);

    return (
        <>
            <div className="container mx-auto py-8 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Rules</h1>
                    <div className="flex gap-2">
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <PlusIcon className="h-4 w-4" />
                            Create Rule
                        </Button>
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="icon"
                            disabled={isLoading}
                        >
                            <RefreshCwIcon
                                className={`h-4 w-4 ${
                                    isLoading ? "animate-spin" : ""
                                }`}
                            />
                        </Button>
                    </div>
                </div>

                <RulesTable
                    rules={rules}
                    onEdit={updateRule}
                    onDelete={deleteRules}
                    isLoading={isLoading}
                    showEmpty={showEmpty}
                    showError={showError}
                />
            </div>

            <CreateRuleDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={createRule}
            />
        </>
    );
}

export default RulesPage;
