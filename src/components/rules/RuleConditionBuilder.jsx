import { useState, useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PlusIcon, XIcon, GripVertical, TrashIcon } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    RULE_OPERATORS,
    RULE_FIELDS,
    RULE_GROUP_OPERATORS,
    STUDY_LOAD_LABELS,
    CLASS_SCHEDULE_LABELS,
    ONSHORE_OFFSHORE_LABELS,
} from "@/constants/enums";
import {
    FIELD_TYPE_MAP,
    FIELD_TYPES,
    formatValueForField,
    getInputTypeForField,
} from "@/lib/utils/ruleFields";
import { useRules } from "@/hooks/useRules";
import { DateRangePicker } from "@/components/common/DateRangePicker";

/**
 * Individual condition component
 */
function RuleCondition({
    condition,
    onChange,
    onDelete,
    dragHandleProps,
    getFieldOptions,
}) {
    const [fieldOptions, setFieldOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const { attributes, listeners } = dragHandleProps || {};

    // Get valid operators for the selected field
    const getValidOperators = useCallback((fieldName) => {
        const field = RULE_FIELDS[fieldName];
        if (!field) return [];

        return Object.entries(RULE_OPERATORS)
            .filter(([_, operator]) => operator.type.includes(field.type))
            .map(([key, operator]) => ({
                value: key,
                label: operator.label,
            }));
    }, []);

    // Load field options when field changes
    useEffect(() => {
        const loadOptions = async () => {
            if (!condition.field) return;

            const field = RULE_FIELDS[condition.field];
            if (!field) return;

            // If the field has predefined options, use those
            if (field.options) {
                setFieldOptions(
                    field.options.map((option) => ({
                        value: option,
                        label: option,
                    }))
                );
                return;
            }

            // If the field needs dynamic options (e.g., campuses from DB)
            if (field.dynamicOptions) {
                setLoading(true);
                try {
                    const options = await getFieldOptions(field.type);
                    setFieldOptions(options);
                } catch (error) {
                    console.error("Error loading options:", error);
                    setFieldOptions([]);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadOptions();
    }, [condition.field, getFieldOptions]);

    const validOperators = useMemo(
        () => getValidOperators(condition.field),
        [condition.field, getValidOperators]
    );

    const handleValueChange = (value) => {
        const fieldType = FIELD_TYPE_MAP[condition.field];
        const formattedValue = formatValueForField(value, fieldType);
        onChange({
            ...condition,
            value: formattedValue,
        });
    };

    const renderValueInput = () => {
        const fieldType = FIELD_TYPE_MAP[condition?.field];
        const field = RULE_FIELDS[condition?.field];

        // For fields with predefined options
        if (field?.options) {
            return (
                <Select
                    value={condition?.value ?? ""}
                    onValueChange={handleValueChange}
                    disabled={
                        loading || !condition.field || !condition.operator
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="select value" />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                                {condition.field === "study_load"
                                    ? STUDY_LOAD_LABELS[option].toLowerCase()
                                    : condition.field === "day_night_classes"
                                    ? CLASS_SCHEDULE_LABELS[
                                          option
                                      ].toLowerCase()
                                    : condition.field === "onshore_offshore"
                                    ? ONSHORE_OFFSHORE_LABELS[
                                          option
                                      ].toLowerCase()
                                    : option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        switch (fieldType) {
            case FIELD_TYPES.NUMBER:
                return (
                    <Input
                        type="number"
                        value={condition?.value ?? ""}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Only allow digits and empty string
                            if (value === "" || /^\d+$/.test(value)) {
                                onChange({
                                    ...condition,
                                    value: value,
                                });
                            }
                        }}
                        onKeyDown={(e) => {
                            // Allow: backspace, delete, tab, escape, enter
                            if (
                                [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
                                // Allow: Ctrl+A, Command+A
                                (e.keyCode === 65 &&
                                    (e.ctrlKey === true ||
                                        e.metaKey === true)) ||
                                // Allow: home, end, left, right, down, up
                                (e.keyCode >= 35 && e.keyCode <= 40)
                            ) {
                                return;
                            }
                            // Ensure that it is a number and stop the keypress if not
                            if (
                                (e.shiftKey ||
                                    e.keyCode < 48 ||
                                    e.keyCode > 57) &&
                                (e.keyCode < 96 || e.keyCode > 105)
                            ) {
                                e.preventDefault();
                            }
                        }}
                        min="0"
                        step="1"
                        placeholder="enter number"
                        className="h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                );
            case FIELD_TYPES.DATE:
                return (
                    <DateRangePicker
                        className="w-full h-9"
                        startDate={
                            condition?.value ? new Date(condition.value) : null
                        }
                        onStartDateChange={(date) =>
                            onChange({
                                ...condition,
                                value: date
                                    ? date.toISOString().split("T")[0]
                                    : null,
                            })
                        }
                        onEndDateChange={() => {}}
                        allowEndDate={false}
                        defaultHasEndDate={false}
                        label=""
                        disablePastDates={false}
                        numberOfMonths={1}
                    />
                );
            case FIELD_TYPES.STRING:
                return (
                    <Input
                        type="text"
                        value={condition?.value ?? ""}
                        onChange={(e) =>
                            onChange({
                                ...condition,
                                value: e.target.value,
                            })
                        }
                        className="h-9"
                    />
                );
            case FIELD_TYPES.BOOLEAN:
                return (
                    <Select
                        value={String(condition?.value)}
                        onValueChange={(value) =>
                            onChange({ ...condition, value: value === "true" })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="select value" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">true</SelectItem>
                            <SelectItem value="false">false</SelectItem>
                        </SelectContent>
                    </Select>
                );
            default:
                // For dynamic options (campus, faculty, etc.)
                return (
                    <Select
                        value={condition?.value ?? ""}
                        onValueChange={handleValueChange}
                        disabled={
                            loading || !condition.field || !condition.operator
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="select value" />
                        </SelectTrigger>
                        <SelectContent>
                            {fieldOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
        }
    };

    const renderOperatorSelect = () => {
        const fieldType = FIELD_TYPE_MAP[condition?.field];
        const validOperators = Object.entries(RULE_OPERATORS)
            .filter(([_, config]) => config.type.includes(fieldType))
            .map(([key, config]) => ({
                value: key,
                label:
                    typeof config.label === "function"
                        ? config.label(fieldType)
                        : config.label,
            }));

        return (
            <Select
                value={condition?.operator ?? ""}
                onValueChange={(value) =>
                    onChange({
                        ...condition,
                        operator: value,
                        value: "",
                    })
                }
                disabled={!condition?.field}
            >
                <SelectTrigger>
                    <SelectValue placeholder="select operator" />
                </SelectTrigger>
                <SelectContent>
                    {validOperators.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    };

    return (
        <div className="flex items-center gap-3 pr-2">
            <DragHandle attributes={attributes} listeners={listeners} />
            <Select
                value={condition.field}
                onValueChange={(value) =>
                    onChange({
                        ...condition,
                        field: value,
                        operator: "",
                        value: "",
                    })
                }
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(RULE_FIELDS).map(([key, field]) => (
                        <SelectItem key={key} value={key}>
                            {field.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">is</div>
            {renderOperatorSelect()}
            {condition?.field === "accommodation_price_per_week" && (
                <div className="text-sm text-muted-foreground -mr-1">$</div>
            )}
            {renderValueInput()}
            <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="min-w-9 w-9 h-9 p-0 flex items-center justify-center text-muted-foreground/50 hover:text-destructive"
            >
                <TrashIcon className="h-4 w-4" />
            </Button>
        </div>
    );
}

function DragHandle({ attributes, listeners }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="min-w-9 w-9 h-9 p-0 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground rounded-md hover:bg-muted/50 [&>svg]:size-5 cursor-move -mr-2"
            {...attributes}
            {...listeners}
        >
            <GripVertical />
        </Button>
    );
}

function SortableCondition({
    id,
    condition,
    onChange,
    onDelete,
    getFieldOptions,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative">
            {condition.group_operator && condition.conditions ? (
                <RuleConditionGroup
                    group={condition}
                    onChange={onChange}
                    onDelete={onDelete}
                    level={1}
                    dragHandleProps={{ attributes, listeners }}
                    getFieldOptions={getFieldOptions}
                />
            ) : (
                <RuleCondition
                    condition={condition}
                    onChange={onChange}
                    onDelete={onDelete}
                    getFieldOptions={getFieldOptions}
                    dragHandleProps={{ attributes, listeners }}
                />
            )}
        </div>
    );
}

/**
 * Condition group component that can contain conditions or other groups
 */
function RuleConditionGroup({
    group,
    onChange,
    onDelete,
    level = 0,
    dragHandleProps,
    getFieldOptions,
}) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleOperatorChange = (operator) => {
        const newGroup = { ...group, group_operator: operator };
        onChange(newGroup);
    };

    const handleConditionChange = (index, condition) => {
        const newConditions = [...group.conditions];
        newConditions[index] = condition;
        const newGroup = { ...group, conditions: newConditions };
        onChange(newGroup);
    };

    const handleConditionDelete = (index) => {
        // If this is the last condition in a nested group, delete the whole group
        if (group.conditions.length === 1 && level > 0) {
            onDelete();
            return;
        }

        // Don't delete if it's the last condition in the root group
        if (group.conditions.length <= 1 && level === 0) return;

        const newGroup = {
            ...group,
            conditions: group.conditions.filter((_, i) => i !== index),
        };
        onChange(newGroup);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = group.conditions.findIndex(
            (item) => `${item.field || "group"}-${active.id}` === active.id
        );
        const newIndex = group.conditions.findIndex(
            (item) => `${item.field || "group"}-${over.id}` === over.id
        );

        const newGroup = {
            ...group,
            conditions: arrayMove(group.conditions, oldIndex, newIndex),
        };
        onChange(newGroup);
    };

    const handleAddCondition = () => {
        const newGroup = {
            ...group,
            conditions: [
                ...group.conditions,
                { field: "", operator: "", value: "" },
            ],
        };
        onChange(newGroup);
    };

    const handleAddGroup = () => {
        const newGroup = {
            ...group,
            conditions: [
                ...group.conditions,
                {
                    group_operator: RULE_GROUP_OPERATORS.AND,
                    conditions: [
                        {
                            id: String(Date.now()),
                            field: "",
                            operator: "",
                            value: "",
                        },
                    ],
                },
            ],
        };
        onChange(newGroup);
    };

    // Don't render anything if there are no conditions
    if (!group.conditions || group.conditions.length === 0) {
        return null;
    }

    return (
        <div className="relative border rounded-xl my-8 overflow-hidden">
            <div
                className={`flex items-center w-full bg-muted/50 p-2 pr-4 gap-2 ${
                    level < 1 ? "pl-4" : "pl-1.5"
                }`}
            >
                {level > 0 && <DragHandle {...dragHandleProps} />}
                <div className="text-sm text-muted-foreground">If</div>
                <Select
                    value={group.group_operator}
                    onValueChange={handleOperatorChange}
                >
                    <SelectTrigger className="w-fit border-none bg-background hover:bg-transparent hover:no-underline focus:ring-0 px-2">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={RULE_GROUP_OPERATORS.OR}>
                            any
                        </SelectItem>
                        <SelectItem value={RULE_GROUP_OPERATORS.AND}>
                            all
                        </SelectItem>
                    </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                    of the following are true
                </div>

                {level > 0 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                        className="ml-auto hover:bg-muted"
                    >
                        <XIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className={`px-4 ${level > 0 ? "" : ""}`}>
                <div className="space-y-4 mt-6">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={group.conditions.map(
                                (item, index) =>
                                    `${item.field || "group"}-${index}`
                            )}
                            strategy={verticalListSortingStrategy}
                        >
                            {group.conditions.map((condition, index) => (
                                <SortableCondition
                                    key={`${
                                        condition.field || "group"
                                    }-${index}`}
                                    id={`${
                                        condition.field || "group"
                                    }-${index}`}
                                    condition={condition}
                                    onChange={(newCondition) =>
                                        handleConditionChange(
                                            index,
                                            newCondition
                                        )
                                    }
                                    onDelete={() =>
                                        handleConditionDelete(index)
                                    }
                                    getFieldOptions={getFieldOptions}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <div className="flex justify-center gap-2 py-4 mt-8 border-t -mx-4 px-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddCondition}
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        {level > 0 ? "Add Group Condition" : "Add Condition"}
                    </Button>
                    {level === 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddGroup}
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Group
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Main condition builder component
 */
export function RuleConditionBuilder({ conditions = [], onChange }) {
    const { getFieldOptions } = useRules();
    const [group, setGroup] = useState(() => {
        // Initialize with a default condition if empty
        if (!conditions || conditions.length === 0) {
            return {
                group_operator: RULE_GROUP_OPERATORS.AND,
                conditions: [
                    {
                        id: "1",
                        field: "",
                        operator: "",
                        value: "",
                    },
                ],
            };
        }

        // Convert old format to new format if needed
        if (!conditions.group_operator) {
            return {
                group_operator: RULE_GROUP_OPERATORS.AND,
                conditions: conditions.map((condition, index) => ({
                    id: String(index + 1),
                    ...condition,
                })),
            };
        }

        return conditions;
    });

    const handleOperatorChange = (operator) => {
        const newGroup = { ...group, group_operator: operator };
        setGroup(newGroup);
        onChange(newGroup);
    };

    const handleConditionChange = (index, condition) => {
        const newConditions = [...group.conditions];
        newConditions[index] = condition;
        const newGroup = { ...group, conditions: newConditions };
        setGroup(newGroup);
        onChange(newGroup);
    };

    const handleConditionDelete = (index) => {
        // Don't delete if it's the last condition in the root group
        if (group.conditions.length <= 1) return;

        const newGroup = {
            ...group,
            conditions: group.conditions.filter((_, i) => i !== index),
        };
        setGroup(newGroup);
        onChange(newGroup);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = group.conditions.findIndex(
            (item) => `${item.field || "group"}-${active.id}` === active.id
        );
        const newIndex = group.conditions.findIndex(
            (item) => `${item.field || "group"}-${over.id}` === over.id
        );

        const newGroup = {
            ...group,
            conditions: arrayMove(group.conditions, oldIndex, newIndex),
        };
        setGroup(newGroup);
        onChange(newGroup);
    };

    const handleAddCondition = () => {
        const newGroup = {
            ...group,
            conditions: [
                ...group.conditions,
                { field: "", operator: "", value: "" },
            ],
        };
        setGroup(newGroup);
        onChange(newGroup);
    };

    const handleAddGroup = () => {
        const newGroup = {
            ...group,
            conditions: [
                ...group.conditions,
                {
                    group_operator: RULE_GROUP_OPERATORS.AND,
                    conditions: [
                        {
                            id: String(Date.now()),
                            field: "",
                            operator: "",
                            value: "",
                        },
                    ],
                },
            ],
        };
        setGroup(newGroup);
        onChange(newGroup);
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <div className="relative border rounded-xl overflow-hidden">
            <div className="flex items-center w-full bg-muted/50 p-2 pr-4 pl-4 gap-2">
                <div className="text-sm text-muted-foreground">If</div>
                <Select
                    value={group.group_operator}
                    onValueChange={handleOperatorChange}
                >
                    <SelectTrigger className="w-fit border-none bg-background hover:bg-transparent hover:no-underline focus:ring-0 px-2">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={RULE_GROUP_OPERATORS.OR}>
                            any
                        </SelectItem>
                        <SelectItem value={RULE_GROUP_OPERATORS.AND}>
                            all
                        </SelectItem>
                    </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                    of the following are true
                </div>
            </div>

            <div className="px-4">
                <div className="space-y-4 mt-6">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={group.conditions.map(
                                (item, index) =>
                                    `${item.field || "group"}-${index}`
                            )}
                            strategy={verticalListSortingStrategy}
                        >
                            {group.conditions.map((condition, index) => (
                                <SortableCondition
                                    key={`${
                                        condition.field || "group"
                                    }-${index}`}
                                    id={`${
                                        condition.field || "group"
                                    }-${index}`}
                                    condition={condition}
                                    onChange={(newCondition) =>
                                        handleConditionChange(
                                            index,
                                            newCondition
                                        )
                                    }
                                    onDelete={() =>
                                        handleConditionDelete(index)
                                    }
                                    getFieldOptions={getFieldOptions}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <div className="flex justify-center gap-2 py-4 mt-8 border-t -mx-4 px-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddCondition}
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Condition
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddGroup}
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Group
                    </Button>
                </div>
            </div>
        </div>
    );
}

RuleCondition.propTypes = {
    condition: PropTypes.shape({
        field: PropTypes.string.isRequired,
        operator: PropTypes.string.isRequired,
        value: PropTypes.any,
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    dragHandleProps: PropTypes.shape({
        attributes: PropTypes.object,
        listeners: PropTypes.object,
    }),
    getFieldOptions: PropTypes.func.isRequired,
};

RuleConditionGroup.propTypes = {
    group: PropTypes.shape({
        group_operator: PropTypes.oneOf(Object.values(RULE_GROUP_OPERATORS))
            .isRequired,
        conditions: PropTypes.arrayOf(
            PropTypes.oneOfType([
                PropTypes.shape({
                    field: PropTypes.string.isRequired,
                    operator: PropTypes.string.isRequired,
                    value: PropTypes.any,
                }),
                PropTypes.shape({
                    group_operator: PropTypes.oneOf(
                        Object.values(RULE_GROUP_OPERATORS)
                    ).isRequired,
                    conditions: PropTypes.array.isRequired,
                }),
            ])
        ).isRequired,
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    onDelete: PropTypes.func,
    level: PropTypes.number,
    dragHandleProps: PropTypes.shape({
        attributes: PropTypes.object,
        listeners: PropTypes.object,
    }),
    getFieldOptions: PropTypes.func.isRequired,
};

RuleConditionBuilder.propTypes = {
    conditions: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string,
            field: PropTypes.string,
            operator: PropTypes.string,
            value: PropTypes.any,
        })
    ),
    onChange: PropTypes.func.isRequired,
};
