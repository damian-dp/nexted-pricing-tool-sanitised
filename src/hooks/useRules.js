import { useState, useCallback, useRef } from "react";
import { useSupabaseQuery } from "@/lib/supabase";
import { withRetry } from "@/lib/utils/retry";
import { TABLES } from "@/constants/api";
import { useToast } from "@/hooks/use-toast";

// Cache for field options
const optionsCache = new Map();

/**
 * Core hook for managing rules in the application
 *
 * This hook is responsible for:
 * - Managing CRUD operations for rules in Supabase
 * - Handling rule validation and status
 * - Managing loading and error states
 * - Providing user feedback via toasts
 * - Managing field options for rule conditions
 *
 * It serves as the data management layer, handling all API calls and state management.
 * The presentation layer (useRulesTable) builds on top of this hook for displaying data.
 *
 * Key features:
 * - Full CRUD operations
 * - Rule status calculation
 * - Optimistic updates
 * - Error handling with user feedback
 * - Loading states
 * - Field options management
 */
export function useRules() {
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const executeQuery = useSupabaseQuery();
    const { toast } = useToast();

    // Track if a fetch is in progress
    const fetchInProgress = useRef(false);

    /**
     * Fetch all rules from the database
     */
    const fetchRules = useCallback(async () => {
        // Use ref to prevent concurrent fetches
        if (fetchInProgress.current) {
            console.log("Fetch already in progress, skipping");
            return;
        }

        try {
            console.log("Starting to fetch rules...");
            setIsLoading(true);
            setError(null);
            fetchInProgress.current = true;

            if (!executeQuery) {
                console.error("executeQuery is not available");
                throw new Error("Database client not initialized");
            }

            // Use withRetry to handle potential auth initialization delays
            const result = await withRetry(
                async () => {
                    console.log("Executing query with retry...");
                    const queryResult = await executeQuery((client) => {
                        if (!client) {
                            throw new Error("No database client available");
                        }
                        console.log("Query client available, executing...");
                        return client
                            .from(TABLES.RULES)
                            .select("*")
                            .order("created_at", { ascending: false });
                    });
                    console.log("Query completed:", queryResult);
                    return queryResult;
                },
                { maxRetries: 3, initialDelay: 500 }
            );

            const { data, error: fetchError } = result;
            console.log("Query result after retry:", {
                data,
                error: fetchError,
            });

            if (fetchError) {
                if (fetchError.message?.includes("JWTExpired")) {
                    throw new Error(
                        "Your session has expired. Please refresh the page."
                    );
                } else if (fetchError.message?.includes("Invalid JWT")) {
                    throw new Error(
                        "Authentication error. Please sign in again."
                    );
                } else if (fetchError.message?.includes("not exist")) {
                    throw new Error(
                        "Unable to access rules. Please check your permissions."
                    );
                } else if (!data && !fetchError.message) {
                    throw new Error(
                        "Could not connect to the database. Please try again."
                    );
                }
                throw fetchError;
            }

            console.log("Setting rules data:", data);
            setRules(data || []);
        } catch (err) {
            console.error("Detailed error:", {
                message: err.message,
                code: err.code,
                details: err.details,
                hint: err.hint,
                stack: err.stack,
            });
            setError({ message: err.message, timestamp: Date.now() });
            toast({
                title: "Error",
                description: err.message || "Failed to fetch rules",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            fetchInProgress.current = false;
        }
    }, [executeQuery, toast]); // Only depend on stable references

    /**
     * Create a new rule
     * @param {Object} rule - The rule to create
     */
    const createRule = useCallback(
        async (rule) => {
            try {
                setIsLoading(true);
                setError(null);

                const { data, error: createError } = await executeQuery(
                    (client) =>
                        client
                            .from(TABLES.RULES)
                            .insert([rule])
                            .select()
                            .single()
                );

                if (createError) throw createError;

                setRules((prev) => [data, ...prev]);
                toast({
                    title: "Success",
                    description: "Rule created successfully",
                });
                return data;
            } catch (err) {
                setError(err.message);
                console.error("Error creating rule:", err);
                toast({
                    title: "Error",
                    description: "Failed to create rule",
                    variant: "destructive",
                });
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [executeQuery]
    );

    /**
     * Update an existing rule
     * @param {string} id - The ID of the rule to update
     * @param {Object} updates - The updates to apply to the rule
     */
    const updateRule = useCallback(
        async (id, updates) => {
            try {
                setIsLoading(true);
                setError(null);

                const { data, error: updateError } = await executeQuery(
                    (client) =>
                        client
                            .from(TABLES.RULES)
                            .update(updates)
                            .eq("id", id)
                            .select()
                            .single()
                );

                if (updateError) throw updateError;

                setRules((prev) =>
                    prev.map((rule) => (rule.id === id ? data : rule))
                );
                toast({
                    title: "Success",
                    description: "Rule updated successfully",
                });
                return data;
            } catch (err) {
                setError(err.message);
                console.error("Error updating rule:", err);
                toast({
                    title: "Error",
                    description: "Failed to update rule",
                    variant: "destructive",
                });
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [executeQuery]
    );

    /**
     * Delete a rule or multiple rules
     * @param {string|string[]} ids - The ID(s) of the rule(s) to delete
     */
    const deleteRules = useCallback(
        async (ids) => {
            const idsArray = Array.isArray(ids) ? ids : [ids];

            try {
                setIsLoading(true);
                setError(null);

                const { error: deleteError } = await executeQuery((client) =>
                    client.from(TABLES.RULES).delete().in("id", idsArray)
                );

                if (deleteError) throw deleteError;

                setRules((prev) =>
                    prev.filter((rule) => !idsArray.includes(rule.id))
                );
                toast({
                    title: "Success",
                    description: `${
                        idsArray.length > 1 ? "Rules" : "Rule"
                    } deleted successfully`,
                });
            } catch (err) {
                setError(err.message);
                console.error("Error deleting rules:", err);
                toast({
                    title: "Error",
                    description: "Failed to delete rule(s)",
                    variant: "destructive",
                });
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [executeQuery]
    );

    /**
     * Calculate the current status of a rule based on its dates
     * @param {Object} rule - The rule to check
     * @returns {string} The status of the rule
     */
    const getRuleStatus = useCallback((rule) => {
        const now = new Date();
        const startDate = rule.startDate ? new Date(rule.startDate) : null;
        const endDate = rule.endDate ? new Date(rule.endDate) : null;

        if (!startDate) return "draft";
        if (startDate > now) return "upcoming";
        if (endDate && endDate < now) return "expired";
        return "active";
    }, []);

    /**
     * Fetch options for a specific field type
     * @param {string} fieldType - The type of field to fetch options for
     * @returns {Promise<Array>} The options for the field
     */
    const getFieldOptions = useCallback(
        async (fieldType) => {
            // Return cached options if available
            if (optionsCache.has(fieldType)) {
                return optionsCache.get(fieldType);
            }

            try {
                let data;
                switch (fieldType) {
                    case "region":
                        const { data: regions, error: regionError } =
                            await executeQuery((client) =>
                                client
                                    .from("region")
                                    .select("id, region_name")
                                    .order("region_name")
                            );
                        if (regionError) {
                            console.error(
                                "Error fetching regions:",
                                regionError
                            );
                            throw regionError;
                        }
                        console.log("Fetched regions:", regions);
                        data = regions?.map((r) => ({
                            id: r.id,
                            value: r.id,
                            label: r.region_name,
                        }));
                        console.log("Mapped region data:", data);
                        break;
                    case "campus":
                        const { data: campuses } = await executeQuery(
                            (client) =>
                                client
                                    .from(TABLES.CAMPUS)
                                    .select("id, campus_name")
                                    .order("campus_name")
                        );
                        data = campuses?.map((c) => ({
                            id: c.id,
                            value: c.id,
                            label: c.campus_name,
                        }));
                        break;
                    case "faculty":
                        console.log("Fetching faculty options...");
                        const { data: faculties, error: facultyError } =
                            await executeQuery((client) =>
                                client
                                    .from("faculties")
                                    .select("id, faculty_name")
                                    .order("faculty_name")
                            );
                        if (facultyError) {
                            console.error(
                                "Error fetching faculties:",
                                facultyError
                            );
                            throw facultyError;
                        }
                        console.log("Fetched faculties:", faculties);
                        data = faculties?.map((f) => ({
                            id: f.id,
                            value: f.id,
                            label: f.faculty_name,
                        }));
                        console.log("Mapped faculty data:", data);
                        break;
                    case "accommodation_type":
                        const { data: accommodationTypes } = await executeQuery(
                            (client) =>
                                client
                                    .from(TABLES.ACCOMMODATION_TYPES)
                                    .select("id, name")
                                    .order("name")
                        );
                        data = accommodationTypes?.map((at) => ({
                            id: at.id,
                            value: at.id,
                            label: at.name,
                        }));
                        break;
                    case "room_size":
                        const { data: roomSizes } = await executeQuery(
                            (client) =>
                                client
                                    .from(TABLES.ROOM_SIZES)
                                    .select("id, name")
                                    .order("name")
                        );
                        data = roomSizes?.map((rs) => ({
                            id: rs.id,
                            value: rs.id,
                            label: rs.name,
                        }));
                        break;
                    default:
                        return null;
                }

                // Cache the options
                if (data) {
                    optionsCache.set(fieldType, data);
                    console.log(`Cached options for ${fieldType}:`, data);
                }
                return data;
            } catch (error) {
                console.error(
                    `Error fetching options for ${fieldType}:`,
                    error
                );
                return null;
            }
        },
        [executeQuery]
    );

    /**
     * Clear the options cache
     */
    const clearOptionsCache = useCallback(() => {
        optionsCache.clear();
    }, []);

    return {
        rules,
        isLoading,
        error,
        fetchRules,
        createRule,
        updateRule,
        deleteRules,
        getRuleStatus,
        getFieldOptions,
        clearOptionsCache,
    };
}
