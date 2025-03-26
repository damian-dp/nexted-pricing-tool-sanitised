import PropTypes from "prop-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import {
    RULE_VALUE_TYPES,
    APPLIES_TO_TYPES,
    APPLIES_TO_LABELS,
} from "@/constants/enums";

/**
 * First step in rule creation - basic rule information
 */
export function RuleDetailsContent({
    formData,
    onFieldChange,
    dateError,
    onDateError,
}) {
    const handleValueChange = (value) => {
        // Convert empty string to empty value for proper validation
        const processedValue = value === "" ? "" : Number(value);
        onFieldChange("value", processedValue);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => onFieldChange("name", e.target.value)}
                    placeholder="Enter rule name"
                />
            </div>

            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                    value={formData.description}
                    onChange={(e) =>
                        onFieldChange("description", e.target.value)
                    }
                    placeholder="Enter rule description"
                />
            </div>

            <div className="space-y-2">
                <Label>Applies To</Label>
                <Select
                    value={formData.applies_to}
                    onValueChange={(value) =>
                        onFieldChange("applies_to", value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select what this rule applies to" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(APPLIES_TO_TYPES).map(
                            ([key, value]) => (
                                <SelectItem key={value} value={value}>
                                    {APPLIES_TO_LABELS[value]}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Value Type</Label>
                <Select
                    value={formData.value_type}
                    onValueChange={(value) =>
                        onFieldChange("value_type", value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select value type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={RULE_VALUE_TYPES.FIXED}>
                            Fixed Amount
                        </SelectItem>
                        <SelectItem value={RULE_VALUE_TYPES.PERCENT}>
                            Percentage
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Value</Label>
                <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    placeholder={
                        formData.value_type === RULE_VALUE_TYPES.PERCENT
                            ? "Enter percentage"
                            : "Enter amount"
                    }
                />
            </div>

            <DateRangePicker
                label="Rule Validity Period"
                startDate={formData.start_date}
                endDate={formData.end_date}
                onStartDateChange={(date) => onFieldChange("start_date", date)}
                onEndDateChange={(date) => onFieldChange("end_date", date)}
                error={dateError}
                onError={onDateError}
                checkboxLabel="Set an end date for this rule"
            />
        </div>
    );
}

RuleDetailsContent.propTypes = {
    formData: PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        applies_to: PropTypes.oneOf(Object.values(APPLIES_TO_TYPES)).isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
        value_type: PropTypes.oneOf(Object.values(RULE_VALUE_TYPES)).isRequired,
        start_date: PropTypes.instanceOf(Date),
        end_date: PropTypes.instanceOf(Date),
    }).isRequired,
    onFieldChange: PropTypes.func.isRequired,
    dateError: PropTypes.string,
    onDateError: PropTypes.func.isRequired,
};
