import PropTypes from "prop-types";
import { RuleConditionBuilder } from "@/components/rules/RuleConditionBuilder";

/**
 * Form step for defining rule conditions
 * Uses RuleConditionBuilder to create complex condition trees
 */
export function RuleConditionsContent({ formData, onFieldChange }) {
    return (
        <div className="space-y-4">
            <RuleConditionBuilder
                conditions={formData.conditions}
                onChange={(conditions) =>
                    onFieldChange("conditions", conditions)
                }
            />
        </div>
    );
}

RuleConditionsContent.propTypes = {
    formData: PropTypes.shape({
        conditions: PropTypes.array.isRequired,
    }).isRequired,
    onFieldChange: PropTypes.func.isRequired,
};
