import { useMemo } from "react";
import { useRules } from "@/hooks/useRules";

/**
 * Hook for managing the presentation layer of the rules table
 *
 * This hook is responsible for:
 * - Formatting rules data for table display
 * - Computing derived table states (empty, loading, error states)
 * - Providing table-specific operations
 *
 * It uses useRules for the underlying data management and adds the presentation layer
 * on top of it. This separation allows for cleaner code organization where:
 * - Data management and API calls live in useRules
 * - Table-specific formatting and states live here
 */
export function useRulesTable() {
    const {
        rules,
        isLoading,
        error,
        fetchRules,
        createRule,
        updateRule,
        deleteRules,
        getRuleStatus,
    } = useRules();

    // Helper function to format rule values
    const formatValue = (rule) => {
        if (!rule?.value) return "$0";
        if (rule.valueType === "percentage") {
            return `${rule.value}%`;
        }
        return `$${rule.value}`;
    };

    // Format rules data for table display
    const formattedRules = useMemo(() => {
        if (!Array.isArray(rules)) return [];
        return rules.map((rule) => ({
            ...rule,
            status: getRuleStatus(rule),
            valueFormatted: formatValue(rule),
        }));
    }, [rules, getRuleStatus, formatValue]);

    // Compute display states
    const hasData = Boolean(formattedRules?.length);
    const showLoading = isLoading && !hasData;
    const showError = Boolean(error?.message) && !showLoading && !hasData;
    const showEmpty = !showLoading && !hasData && !showError && !isLoading;

    return {
        rules: formattedRules,
        isLoading,
        error,
        hasData,
        showLoading,
        showError,
        showEmpty,
        fetchRules,
        createRule,
        updateRule,
        deleteRules,
    };
}
