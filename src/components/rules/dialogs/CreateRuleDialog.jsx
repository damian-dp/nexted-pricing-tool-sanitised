import { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RuleDetailsContent } from "./steps/RuleDetailsContent";
import { RuleConditionsContent } from "./steps/RuleConditionsContent";
import { RuleTestContent } from "./steps/RuleTestContent";
import { RULE_VALUE_TYPES, APPLIES_TO_LABELS } from "@/constants/enums";
import { formatDateForAPI } from "@/lib/utils/date";

/**
 * Steps in the rule creation process
 */
const STEPS = {
    BASIC_INFO: "BASIC_INFO",
    CONDITIONS: "CONDITIONS",
    TEST: "TEST",
};

/**
 * Dialog for creating new rules with a multi-step form process
 */
export function CreateRuleDialog({ open, onOpenChange, onSubmit }) {
    const initialFormData = useMemo(
        () => ({
            name: "",
            description: "",
            applies_to: "", // Using snake_case to match backend
            value: "",
            value_type: RULE_VALUE_TYPES.FIXED, // Using snake_case to match backend
            conditions: [], // Initialize as empty array
            start_date: new Date(), // Using snake_case to match backend
            end_date: null, // Using snake_case to match backend
        }),
        []
    );

    const [step, setStep] = useState(STEPS.BASIC_INFO);
    const [formData, setFormData] = useState(initialFormData);
    const [dateError, setDateError] = useState("");

    const handleFieldChange = useCallback((field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const handleSubmit = () => {
        const submissionData = {
            ...formData,
            start_date: formatDateForAPI(formData.start_date),
            end_date: formatDateForAPI(formData.end_date),
            value: Number(formData.value), // Ensure value is a number
        };
        onSubmit(submissionData);
        onOpenChange(false);
        setStep(STEPS.BASIC_INFO);
        setFormData(initialFormData);
    };

    const reviewData = useMemo(
        () => ({
            name: formData.name,
            description: formData.description,
            appliesTo: formData.applies_to,
            value: Number(formData.value),
            valueType: formData.value_type,
            conditions: formData.conditions,
            startDate: formatDateForAPI(formData.start_date),
            endDate: formatDateForAPI(formData.end_date),
        }),
        [formData]
    );

    const renderContent = () => {
        switch (step) {
            case STEPS.BASIC_INFO:
                return (
                    <RuleDetailsContent
                        formData={formData}
                        onFieldChange={handleFieldChange}
                        dateError={dateError}
                        onDateError={setDateError}
                    />
                );
            case STEPS.CONDITIONS:
                return (
                    <RuleConditionsContent
                        formData={formData}
                        onFieldChange={handleFieldChange}
                    />
                );
            case STEPS.TEST:
                return <RuleTestContent rule={reviewData} />;
            default:
                return null;
        }
    };

    const isNextDisabled = () => {
        if (step === STEPS.BASIC_INFO) {
            return (
                !formData.name ||
                !formData.applies_to ||
                !formData.value ||
                !formData.value_type ||
                !!dateError
            );
        }
        if (step === STEPS.CONDITIONS && !formData.applies_to) {
            return true;
        }
        return false;
    };

    const getStepTitle = () => {
        switch (step) {
            case STEPS.BASIC_INFO:
                return "Create Rule - Basic Information";
            case STEPS.CONDITIONS:
                return "Create Rule - Set Conditions";
            case STEPS.TEST:
                return "Create Rule - Test Rule";
            default:
                return "Create Rule";
        }
    };

    const handleStepChange = (direction) => {
        if (direction === "back") {
            setStep((prev) => {
                switch (prev) {
                    case STEPS.TEST:
                        return STEPS.CONDITIONS;
                    case STEPS.CONDITIONS:
                        return STEPS.BASIC_INFO;
                    default:
                        return prev;
                }
            });
        } else {
            setStep((prev) => {
                switch (prev) {
                    case STEPS.BASIC_INFO:
                        return STEPS.CONDITIONS;
                    case STEPS.CONDITIONS:
                        return STEPS.TEST;
                    default:
                        return prev;
                }
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{getStepTitle()}</DialogTitle>
                </DialogHeader>

                {renderContent()}

                <DialogFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => handleStepChange("back")}
                    >
                        Back
                    </Button>

                    {step !== STEPS.TEST ? (
                        <Button
                            onClick={() => handleStepChange("next")}
                            disabled={isNextDisabled()}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit}>Create Rule</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

CreateRuleDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onOpenChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
};
