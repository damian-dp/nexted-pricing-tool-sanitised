import PropTypes from "prop-types";
import { useMemo } from "react";
import {
    RULE_OPERATORS,
    RULE_FIELDS,
    RULE_VALUE_TYPES,
    APPLIES_TO_LABELS,
} from "@/constants/enums";
import { formatDate } from "@/lib/utils/date";

export function RulePreview({ rule }) {
    if (!rule) return null;

    const formatValue = (value) => {
        if (typeof value === "boolean") {
            return value ? "Yes" : "No";
        }
        if (Array.isArray(value)) {
            return value.join(", ");
        }
        if (value instanceof Date) {
            return formatDate(value);
        }
        return value;
    };

    const formattedDates = useMemo(() => {
        if (!rule) return { startDate: null, endDate: null };
        return {
            startDate: rule.startDate
                ? formatDate(new Date(rule.startDate))
                : null,
            endDate: rule.endDate ? formatDate(new Date(rule.endDate)) : null,
        };
    }, [rule?.startDate, rule?.endDate]);

    const formattedAction = useMemo(() => {
        const { appliesTo, value, valueType } = rule;
        const isDiscount = appliesTo.includes("discount");

        if (valueType === RULE_VALUE_TYPES.PERCENT) {
            if (isDiscount) {
                return `Apply ${Math.abs(value)}% discount`;
            }
            return `Apply ${value}% ${value >= 0 ? "increase" : "decrease"}`;
        }

        // Fixed amount
        if (isDiscount) {
            return `Subtract $${Math.abs(value)}`;
        }
        return `${value >= 0 ? "Add" : "Subtract"} $${Math.abs(value)}`;
    }, [rule?.appliesTo, rule?.value, rule?.valueType]);

    const formattedConditions = useMemo(() => {
        if (!rule?.conditions || Object.keys(rule.conditions).length === 0) {
            return "No conditions set";
        }

        return Object.entries(rule.conditions)
            .map(([field, condition]) => {
                const fieldLabel = RULE_FIELDS[field]?.label || field;
                const operator =
                    RULE_OPERATORS[condition.operator]?.label ||
                    condition.operator;
                const value = formatValue(condition.value);
                return `${fieldLabel} ${operator} ${value}`;
            })
            .join(" AND ");
    }, [rule?.conditions]);

    return (
        <div className="space-y-4 p-4 rounded-lg border">
            <div>
                <h3 className="font-medium">Rule Name</h3>
                <p>{rule.name}</p>
            </div>

            {rule.description && (
                <div>
                    <h3 className="font-medium">Description</h3>
                    <p>{rule.description}</p>
                </div>
            )}

            <div>
                <h3 className="font-medium">Applies To</h3>
                <p>{APPLIES_TO_LABELS[rule.appliesTo]}</p>
            </div>

            <div>
                <h3 className="font-medium">Conditions</h3>
                <p>{formattedConditions}</p>
            </div>

            <div>
                <h3 className="font-medium">Action</h3>
                <p>{formattedAction}</p>
            </div>

            {formattedDates.startDate && (
                <div>
                    <h3 className="font-medium">Valid From</h3>
                    <p>{formattedDates.startDate}</p>
                </div>
            )}

            {formattedDates.endDate && (
                <div>
                    <h3 className="font-medium">Valid Until</h3>
                    <p>{formattedDates.endDate}</p>
                </div>
            )}
        </div>
    );
}

RulePreview.propTypes = {
    rule: PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        appliesTo: PropTypes.string.isRequired,
        conditions: PropTypes.object,
        value: PropTypes.number.isRequired,
        valueType: PropTypes.oneOf(Object.values(RULE_VALUE_TYPES)),
        startDate: PropTypes.string,
        endDate: PropTypes.string,
    }),
};
