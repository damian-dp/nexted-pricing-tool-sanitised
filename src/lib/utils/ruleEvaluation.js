import { DB_OPERATORS } from "@/constants/enums";

/**
 * Evaluates a single condition against a quote
 * @param {Object} condition - The condition to evaluate
 * @param {Object} quote - The quote to evaluate against
 * @returns {boolean} - Whether the condition is met
 */
function evaluateCondition(condition, quote) {
    const { field, operator, value } = condition;
    const quoteValue = quote[field];

    // Handle null/undefined quote values
    if (quoteValue === null || quoteValue === undefined) {
        return false;
    }

    switch (operator) {
        // Equality operators
        case DB_OPERATORS.EQUALITY.EQ:
            return quoteValue === value;
        case DB_OPERATORS.EQUALITY.NEQ:
            return quoteValue !== value;
        case DB_OPERATORS.EQUALITY.GT:
            return quoteValue > value;
        case DB_OPERATORS.EQUALITY.GTE:
            return quoteValue >= value;
        case DB_OPERATORS.EQUALITY.LT:
            return quoteValue < value;
        case DB_OPERATORS.EQUALITY.LTE:
            return quoteValue <= value;

        // String operators
        case DB_OPERATORS.STRING.LIKE:
            return String(quoteValue).includes(value);
        case DB_OPERATORS.STRING.NOT_LIKE:
            return !String(quoteValue).includes(value);
        case DB_OPERATORS.STRING.ILIKE:
            return String(quoteValue)
                .toLowerCase()
                .includes(String(value).toLowerCase());
        case DB_OPERATORS.STRING.NOT_ILIKE:
            return !String(quoteValue)
                .toLowerCase()
                .includes(String(value).toLowerCase());

        // Date operators
        case DB_OPERATORS.DATE.BEFORE:
            return new Date(quoteValue) < new Date(value);
        case DB_OPERATORS.DATE.AFTER:
            return new Date(quoteValue) > new Date(value);

        default:
            console.warn(`Unsupported operator: ${operator}`);
            return false;
    }
}

/**
 * Evaluates a rule against a quote
 * @param {Object} rule - The rule to evaluate
 * @param {Object} quote - The quote to evaluate against
 * @returns {Object} - Evaluation results including which conditions matched
 */
export function evaluateRule(rule, quote) {
    // Evaluate each condition
    const conditionResults = rule.conditions.map((condition) =>
        evaluateCondition(condition, quote)
    );

    // Rule applies if all conditions are met
    const applies = conditionResults.every((result) => result);

    return {
        conditions: conditionResults,
        applies,
    };
}
