/**
 * Utility functions for evaluating rule conditions in the quote generation process.
 * These functions are used to determine if a rule should be applied based on its conditions.
 */

/**
 * Gets a nested value from an object using a dot-notation path
 * @param obj The object to get the value from
 * @param path The path to the value, using dot notation (e.g., "student_details.firstName")
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split(".");
    let result = obj;

    for (const key of keys) {
        if (result === undefined || result === null) {
            return undefined;
        }
        result = result[key];
    }

    return result;
}

/**
 * Evaluates a single operator against a value
 * @param operator The operator to evaluate (e.g., "eq", "gt", "in")
 * @param value The value to compare against
 * @param compareValue The value to compare with
 * @returns Whether the condition is met
 */
export function evaluateOperator(
    operator: string,
    value: any,
    compareValue: any
): boolean {
    // Handle undefined or null values
    if (value === undefined || value === null) {
        return operator === "notexists";
    }

    switch (operator) {
        // Equality operators
        case "eq":
            return value === compareValue;
        case "neq":
            return value !== compareValue;
        case "gt":
            return value > compareValue;
        case "gte":
            return value >= compareValue;
        case "lt":
            return value < compareValue;
        case "lte":
            return value <= compareValue;
        case "in":
            return Array.isArray(compareValue) && compareValue.includes(value);
        case "nin":
            return Array.isArray(compareValue) && !compareValue.includes(value);

        // String operators
        case "like":
            return (
                typeof value === "string" &&
                typeof compareValue === "string" &&
                value.includes(compareValue)
            );
        case "notlike":
            return (
                typeof value === "string" &&
                typeof compareValue === "string" &&
                !value.includes(compareValue)
            );
        case "ilike":
            return (
                typeof value === "string" &&
                typeof compareValue === "string" &&
                value.toLowerCase().includes(compareValue.toLowerCase())
            );
        case "nilike":
            return (
                typeof value === "string" &&
                typeof compareValue === "string" &&
                !value.toLowerCase().includes(compareValue.toLowerCase())
            );
        case "regex":
            return (
                typeof value === "string" &&
                new RegExp(compareValue).test(value)
            );

        // Date operators
        case "before":
            return new Date(value) < new Date(compareValue);
        case "after":
            return new Date(value) > new Date(compareValue);
        case "between":
            if (!Array.isArray(compareValue) || compareValue.length !== 2) {
                return false;
            }
            const date = new Date(value);
            return (
                date >= new Date(compareValue[0]) &&
                date <= new Date(compareValue[1])
            );

        // Existence operators
        case "exists":
            return value !== undefined && value !== null;
        case "notexists":
            return value === undefined || value === null;

        default:
            console.warn(`Unknown operator: ${operator}`);
            return false;
    }
}

/**
 * Evaluates if a set of conditions matches the provided quote data
 * @param conditions The conditions object from a rule
 * @param quoteData The quote data to evaluate against
 * @returns Whether all conditions match
 */
export function evaluateRuleConditions(
    conditions: Record<string, any>,
    quoteData: Record<string, any>
): boolean {
    // For each field in conditions
    for (const [field, operators] of Object.entries(conditions)) {
        // Special handling for compound operators
        if (field === "OR" && Array.isArray(operators)) {
            const orResult = operators.some((condition) =>
                evaluateRuleConditions(condition, quoteData)
            );
            if (!orResult) return false;
            continue;
        }

        if (field === "AND" && Array.isArray(operators)) {
            const andResult = operators.every((condition) =>
                evaluateRuleConditions(condition, quoteData)
            );
            if (!andResult) return false;
            continue;
        }

        // Get the value from quoteData (handling nested paths)
        const value = getNestedValue(quoteData, field);

        // For each operator on this field
        for (const [operator, compareValue] of Object.entries(operators)) {
            if (!evaluateOperator(operator, value, compareValue)) {
                return false;
            }
        }
    }

    return true;
}
