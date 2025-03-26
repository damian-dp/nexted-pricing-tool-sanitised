import PropTypes from "prop-types";
import { Label } from "@/components/ui/label";
import { RulePreview } from "@/components/rules/RulePreview";
import {
    RULE_VALUE_TYPES,
    APPLIES_TO_TYPES,
    APPLIES_TO_LABELS,
} from "@/constants/enums";
import { formatDate } from "@/lib/utils/date";

/**
 * Component for reviewing rule details before creation/update
 * Displays a summary of the rule and a preview of how it will be applied
 */
export function RuleReviewContent({ formData }) {
    const formatValue = (value, valueType) => {
        if (valueType === RULE_VALUE_TYPES.PERCENT) {
            return `${value}%`;
        }
        return `$${value}`;
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-sm text-muted-foreground">
                            Rule Name
                        </Label>
                        <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                        <Label className="text-sm text-muted-foreground">
                            Applies To
                        </Label>
                        <p className="font-medium">
                            {APPLIES_TO_LABELS[formData.applies_to] ||
                                formData.applies_to}
                        </p>
                    </div>
                    <div>
                        <Label className="text-sm text-muted-foreground">
                            Value
                        </Label>
                        <p className="font-medium">
                            {formatValue(formData.value, formData.valueType)}
                        </p>
                    </div>
                    <div>
                        <Label className="text-sm text-muted-foreground">
                            Value Type
                        </Label>
                        <p className="font-medium capitalize">
                            {formData.valueType}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <Label className="text-sm text-muted-foreground">
                            Description
                        </Label>
                        <p className="font-medium">{formData.description}</p>
                    </div>
                    <div className="col-span-2">
                        <Label className="text-sm text-muted-foreground">
                            Validity Period
                        </Label>
                        <p className="font-medium">
                            From {formatDate(formData.startDate)}
                            {formData.endDate
                                ? ` to ${formatDate(formData.endDate)}`
                                : " (No end date)"}
                        </p>
                    </div>
                </div>
            </div>
            <RulePreview rule={formData} />
        </div>
    );
}

RuleReviewContent.propTypes = {
    formData: PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        applies_to: PropTypes.oneOf(Object.values(APPLIES_TO_TYPES)).isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
        valueType: PropTypes.oneOf(Object.values(RULE_VALUE_TYPES)).isRequired,
        startDate: PropTypes.instanceOf(Date).isRequired,
        endDate: PropTypes.instanceOf(Date),
        conditions: PropTypes.object,
    }).isRequired,
};
