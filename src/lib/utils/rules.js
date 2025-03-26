import {
    RULE_OPERATORS,
    RULE_FIELDS,
    RULE_TYPES,
    RULE_VALUE_TYPES,
} from "@/constants/enums";

/**
 * Format a rule's value based on its type and value type
 */
export function formatRuleValue(rule) {
    const { value, valueType } = rule;
    if (valueType === RULE_VALUE_TYPES.PERCENTAGE) {
        return `${value}%`;
    }
    return `$${value}`;
}

/**
 * Format a rule's action description
 */
export function formatRuleAction(rule) {
    const { type, value, valueType } = rule;

    if (type === RULE_TYPES.PRICING) {
        if (valueType === RULE_VALUE_TYPES.PERCENTAGE) {
            return `Apply ${value}% ${
                value >= 0 ? "increase" : "decrease"
            } to the price`;
        }
        return `Add $${Math.abs(value)} ${
            value >= 0 ? "to" : "from"
        } the price`;
    }

    if (type === RULE_TYPES.FEE) {
        return `Add a fee of $${value}`;
    }

    if (type === RULE_TYPES.DISCOUNT) {
        if (valueType === RULE_VALUE_TYPES.PERCENTAGE) {
            return `Apply ${value}% discount`;
        }
        return `Subtract $${value} from the total`;
    }

    return "Unknown action";
}

/**
 * Format a single condition into a readable string
 */
export function formatCondition(condition) {
    const field = RULE_FIELDS[condition.field]?.label || condition.field;
    const operator =
        RULE_OPERATORS[condition.operator]?.label || condition.operator;
    const value = formatConditionValue(condition.value);
    return `${field} ${operator} ${value}`;
}

/**
 * Format a condition's value based on its type
 */
export function formatConditionValue(value) {
    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }
    if (Array.isArray(value)) {
        return value.join(", ");
    }
    return value;
}

/**
 * Format all conditions into a readable string
 */
export function formatRuleConditions(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) {
        return "No conditions set";
    }
    return Object.values(conditions).map(formatCondition).join(" AND ");
}

/**
 * Get valid operators for a given field type
 */
export function getOperatorsForFieldType(fieldName) {
    const field = RULE_FIELDS[fieldName];
    if (!field) return [];

    return Object.entries(RULE_OPERATORS)
        .filter(([_, operator]) => operator.type.includes(field.type))
        .map(([key, operator]) => ({
            value: key,
            label: operator.label,
        }));
}

/**
 * Calculate a rule's current status based on its dates
 */
export function getRuleStatus(rule) {
    const now = new Date();
    const startDate = rule.startDate ? new Date(rule.startDate) : null;
    const endDate = rule.endDate ? new Date(rule.endDate) : null;

    if (!startDate) return "draft";
    if (startDate > now) return "upcoming";
    if (endDate && endDate < now) return "expired";
    return "active";
}

/**
 * Validate basic rule information
 */
export function validateRuleBasicInfo(formData) {
    const errors = {};

    if (!formData.name?.trim()) {
        errors.name = "Name is required";
    }

    if (!formData.type) {
        errors.type = "Type is required";
    }

    if (!formData.value && formData.value !== 0) {
        errors.value = "Value is required";
    }

    if (!formData.startDate) {
        errors.startDate = "Start date is required";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
