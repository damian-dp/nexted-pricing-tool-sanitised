import { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SAMPLE_QUOTES } from "@/constants/sampleQuotes";
import { evaluateRule } from "@/lib/utils/ruleEvaluation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Plus, Check, X } from "lucide-react";
import {
    AlertDialog,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";

// Template for a new custom quote
const CUSTOM_QUOTE_TEMPLATE = {
    id: "custom",
    name: "Custom Quote",
    quote: {
        student_visa: false,
        onshore_offshore: "offshore",
        region_id: 1,
        course_type: "ELICOS",
        faculty_id: "business",
        campus_id: "sydney",
        duration_weeks: 24,
        study_load: "full_time",
        day_night_classes: "day",
        intake_date: "2024-07-01",
        accommodation_type_id: "homestay",
        room_size_id: "single",
        accommodation_price_per_week: 350,
        needs_transport: true,
        previous_student: false,
    },
};

function CreateQuoteTile({ onClick }) {
    return (
        <Card
            className="p-4 hover:border-primary transition-colors flex flex-col items-center justify-center h-full min-h-[120px] border-dashed gap-3"
            onClick={onClick}
        >
            <Plus className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
                Create Sample Quote
            </p>
        </Card>
    );
}

CreateQuoteTile.propTypes = {
    onClick: PropTypes.func.isRequired,
};

function QuoteTile({ quote, isSelected, onSelect, onEdit }) {
    // Generate a description based on the quote data
    const description = [
        quote.quote.student_visa ? "Student Visa" : "No Student Visa",
        `${
            quote.quote.onshore_offshore === "onshore" ? "Onshore" : "Offshore"
        }`,
        quote.quote.course_type,
        `${quote.quote.duration_weeks} weeks`,
        quote.quote.study_load === "full_time" ? "Full Time" : "Part Time",
        quote.quote.day_night_classes === "day"
            ? "Day Classes"
            : "Night Classes",
    ].join(" • ");

    return (
        <Card
            className={`p-4 hover:border-primary transition-colors min-h-[120px] ${
                isSelected ? "border-primary" : ""
            }`}
            onClick={onSelect}
        >
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <h3 className="font-medium">{quote.name}</h3>
                    {quote.id === "custom" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                        >
                            Edit
                        </Button>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </Card>
    );
}

QuoteTile.propTypes = {
    quote: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
};

function ConditionItem({ condition, value, showGroupOperator }) {
    // Format the field name to be more readable
    const formatField = (field) => {
        if (!field) return "Unknown Field";

        switch (field) {
            case "student_visa":
                return "Student Visa";
            case "onshore_offshore":
                return "Onshore/Offshore";
            case "course_type":
                return "Course Type";
            case "study_load":
                return "Study Load";
            case "day_night_classes":
                return "Class Schedule";
            case "campus_id":
                return "Campus";
            case "accommodation_type_id":
                return "Accommodation Type";
            case "room_size_id":
                return "Room Size";
            case "faculty_id":
                return "Faculty";
            case "region_id":
                return "Region";
            default:
                return field
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
        }
    };

    // Format the operator to be more readable
    const formatOperator = (op) => {
        if (!op) return "unknown";

        switch (op) {
            case "eq":
                return "equal to";
            case "neq":
                return "not equal to";
            case "gt":
                return "greater than";
            case "gte":
                return "greater than or equal to";
            case "lt":
                return "less than";
            case "lte":
                return "less than or equal to";
            default:
                return op;
        }
    };

    // Format the value to be display-friendly
    const formatValue = (val, field) => {
        if (val === null || val === undefined) return "null";
        if (typeof val === "boolean") return val ? "true" : "false";

        // Handle specific field values
        if (field === "faculty_id") {
            switch (val) {
                case "business":
                    return "Business";
                case "engineering":
                    return "Engineering";
                case "arts":
                    return "Arts";
                case "science":
                    return "Science";
                case "law":
                    return "Law";
                case "medicine":
                    return "Medicine";
                default:
                    return "Unknown Faculty";
            }
        }

        if (typeof val === "string") {
            switch (val.toLowerCase()) {
                case "onshore":
                    return "Onshore";
                case "offshore":
                    return "Offshore";
                case "day":
                    return "Day Classes";
                case "night":
                    return "Night Classes";
                case "full_time":
                    return "Full Time";
                case "part_time":
                    return "Part Time";
                case "homestay":
                    return "Homestay";
                case "single":
                    return "Single Room";
                case "shared":
                    return "Shared Room";
                case "and":
                    return "AND";
                case "or":
                    return "OR";
                case "elicos":
                    return "ELICOS";
                case "vet":
                    return "VET";
                case "he":
                    return "Higher Education";
                default:
                    // Handle potential undefined or null string
                    if (!val) return "Unknown";
                    return val
                        .split("_")
                        .map(
                            (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ");
            }
        }
        return String(val);
    };

    // Add error handling for malformed conditions
    if (!condition || typeof condition !== "object") {
        return (
            <div className="flex items-center gap-2 text-destructive">
                <X className="h-5 w-5 shrink-0" />
                <span>Invalid condition format</span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                {value ? (
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                    <X className="h-5 w-5 text-red-500 shrink-0" />
                )}
                <div className="flex items-center gap-1.5">
                    <span className="font-medium">
                        {formatField(condition.field)}
                    </span>
                    <span className="text-muted-foreground">is</span>
                    <span className="text-muted-foreground">
                        {formatOperator(condition.operator)}
                    </span>
                    <span className="font-medium">
                        {formatValue(condition.value, condition.field)}
                    </span>
                </div>
            </div>
            {showGroupOperator && condition.group_operator && (
                <div className="pl-7 text-muted-foreground">
                    {condition.group_operator.toUpperCase()}
                </div>
            )}
        </div>
    );
}

ConditionItem.propTypes = {
    condition: PropTypes.shape({
        field: PropTypes.string.isRequired,
        operator: PropTypes.string.isRequired,
        value: PropTypes.any.isRequired,
        group_operator: PropTypes.string,
    }).isRequired,
    value: PropTypes.bool.isRequired,
    showGroupOperator: PropTypes.bool,
};

export function RuleTestContent({ rule }) {
    const [selectedQuote, setSelectedQuote] = useState(SAMPLE_QUOTES[0]);
    const [customQuote, setCustomQuote] = useState(null);
    const [showCustomEditor, setShowCustomEditor] = useState(false);
    const [editorContent, setEditorContent] = useState("");
    const [editorError, setEditorError] = useState(null);

    // Process the rule conditions properly
    const safeRule = {
        ...rule,
        conditions: (() => {
            // If no conditions, return empty array
            if (!rule.conditions) return [];

            // If conditions is an object with group_operator and conditions array
            if (
                rule.conditions.group_operator &&
                Array.isArray(rule.conditions.conditions)
            ) {
                return rule.conditions.conditions.map((condition) => ({
                    ...condition,
                    group_operator: rule.conditions.group_operator,
                }));
            }

            // If conditions is an array
            if (Array.isArray(rule.conditions)) {
                return rule.conditions;
            }

            // If conditions is a single condition object
            if (typeof rule.conditions === "object") {
                return [rule.conditions];
            }

            return [];
        })(),
    };

    // Evaluate the rule against the current quote
    const evaluation = evaluateRule(
        safeRule,
        customQuote || selectedQuote.quote
    );

    // Log the rule and conditions for debugging
    console.log("Original Rule:", rule);
    console.log("Safe Rule:", safeRule);
    console.log("Evaluation:", evaluation);

    const handleCreateCustomQuote = () => {
        setEditorContent(JSON.stringify(CUSTOM_QUOTE_TEMPLATE.quote, null, 2));
        setCustomQuote(CUSTOM_QUOTE_TEMPLATE);
        setSelectedQuote(CUSTOM_QUOTE_TEMPLATE);
        setShowCustomEditor(true);
        setEditorError(null);
    };

    const handleSaveCustomQuote = () => {
        try {
            const parsed = JSON.parse(editorContent);
            setCustomQuote({
                id: "custom",
                name: "Custom Quote",
                quote: parsed,
            });
            setEditorError(null);
            setShowCustomEditor(false);
        } catch (e) {
            setEditorError("Invalid JSON format. Please check your syntax.");
        }
    };

    const allQuotes = [...SAMPLE_QUOTES, ...(customQuote ? [customQuote] : [])];

    // Separate matched and failed conditions
    const matchedConditions = safeRule.conditions.filter(
        (condition, index) => evaluation.conditions[index]
    );
    const failedConditions = safeRule.conditions.filter(
        (condition, index) => !evaluation.conditions[index]
    );

    return (
        <div className="space-y-6">
            <div>
                <Label className="mb-3 block">Sample Quotes</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allQuotes.map((quote) => (
                        <QuoteTile
                            key={quote.id}
                            quote={quote}
                            isSelected={selectedQuote.id === quote.id}
                            onSelect={() => {
                                setSelectedQuote(quote);
                            }}
                            onEdit={() => {
                                setEditorContent(
                                    JSON.stringify(quote.quote, null, 2)
                                );
                                setShowCustomEditor(true);
                                setEditorError(null);
                            }}
                        />
                    ))}
                    {!customQuote && (
                        <CreateQuoteTile onClick={handleCreateCustomQuote} />
                    )}
                </div>
            </div>

            <Dialog
                open={showCustomEditor}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowCustomEditor(false);
                        setEditorError(null);
                    }
                }}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Custom Quote</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {editorError && (
                            <AlertDialog variant="destructive">
                                <AlertDialogDescription>
                                    {editorError}
                                </AlertDialogDescription>
                            </AlertDialog>
                        )}
                        <textarea
                            className="w-full h-[400px] font-mono text-sm p-4 rounded-md border"
                            value={editorContent}
                            onChange={(e) => setEditorContent(e.target.value)}
                            spellCheck={false}
                        />
                        <DialogFooter>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowCustomEditor(false);
                                    setEditorError(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSaveCustomQuote}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="space-y-6">
                <h3 className="font-medium text-lg">Rule Evaluation Results</h3>
                <div className="space-y-6">
                    {matchedConditions.length > 0 && (
                        <div className="rounded-lg border bg-background space-y-3 overflow-hidden">
                            <h4 className="font-medium text-base p-3 border-b bg-emerald-500/10 text-emerald-500">
                                Matched Conditions:
                            </h4>
                            <div className="p-3 space-y-3">
                                {matchedConditions.map((condition, index) => (
                                    <ConditionItem
                                        key={index}
                                        condition={condition}
                                        value={true}
                                        showGroupOperator={
                                            index < matchedConditions.length - 1
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {failedConditions.length > 0 && (
                        <div className="rounded-lg border bg-background space-y-3 overflow-hidden">
                            <h4 className="font-medium text-base p-3 border-b bg-destructive/10 text-destructive">
                                Failed Conditions:
                            </h4>
                            <div className="p-3 space-y-3">
                                {failedConditions.map((condition, index) => (
                                    <ConditionItem
                                        key={index}
                                        condition={condition}
                                        value={false}
                                        showGroupOperator={
                                            index < failedConditions.length - 1
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {safeRule.conditions.length === 0 && (
                        <div className="text-muted-foreground text-center py-4">
                            No conditions set for this rule
                        </div>
                    )}

                    {evaluation.applies && (
                        <div className="pt-4 border-t space-y-3">
                            <h4 className="font-medium">Effect</h4>
                            <div className="py-2 px-4 rounded-lg border bg-card">
                                {safeRule.valueType === "percent" ? (
                                    <span>
                                        {Math.abs(safeRule.value)}%{" "}
                                        {safeRule.value >= 0
                                            ? "increase"
                                            : "decrease"}
                                    </span>
                                ) : (
                                    <span>
                                        {safeRule.value >= 0
                                            ? "Add"
                                            : "Subtract"}{" "}
                                        ${Math.abs(safeRule.value)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

RuleTestContent.propTypes = {
    rule: PropTypes.shape({
        conditions: PropTypes.array.isRequired,
        valueType: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
    }).isRequired,
};
