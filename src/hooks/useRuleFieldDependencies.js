import { useEffect, useState } from "react";
import {
    FIELD_TYPE_MAP,
    getValidOperatorsForField,
} from "@/lib/utils/ruleFields";

export const useRuleFieldDependencies = (selectedField, getFieldOptions) => {
    const [operators, setOperators] = useState({});
    const [values, setValues] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Update operators when field changes
    useEffect(() => {
        if (!selectedField) {
            setOperators({});
            return;
        }

        const fieldType = FIELD_TYPE_MAP[selectedField];
        const validOperators = getValidOperatorsForField(fieldType);
        setOperators(validOperators);
    }, [selectedField]);

    // Update values when field changes
    useEffect(() => {
        const loadFieldOptions = async () => {
            if (!selectedField || !getFieldOptions) {
                setValues([]);
                return;
            }

            const fieldType = FIELD_TYPE_MAP[selectedField];

            // Only fetch options for fields that have predefined values
            if (!["campus", "course_type"].includes(fieldType)) {
                setValues([]);
                return;
            }

            setIsLoading(true);
            try {
                const options = await getFieldOptions(fieldType);
                if (options) {
                    // Transform options to consistent format
                    const formattedOptions = options.map((option) => ({
                        value: option.id,
                        label: option.campus_name || option.name,
                    }));
                    setValues(formattedOptions);
                }
            } catch (error) {
                console.error("Error loading field options:", error);
                setValues([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadFieldOptions();
    }, [selectedField, getFieldOptions]);

    return {
        operators,
        values,
        isLoading,
    };
};
