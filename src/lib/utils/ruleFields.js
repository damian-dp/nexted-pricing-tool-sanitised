import { DB_OPERATORS, RULE_OPERATORS } from "@/constants/enums";

// Field types that determine what operators and input types are available
export const FIELD_TYPES = {
    STRING: "string",
    NUMBER: "number",
    DATE: "date",
    BOOLEAN: "boolean",
    CAMPUS: "campus",
    COURSE_TYPE: "course_type",
    FACULTY: "faculty",
    ACCOMMODATION_TYPE: "accommodation_type",
    ROOM_SIZE: "room_size",
    REGION: "region",
};

// Map fields to their types
export const FIELD_TYPE_MAP = {
    region_id: FIELD_TYPES.REGION,
    onshore_offshore: FIELD_TYPES.STRING,
    student_visa: FIELD_TYPES.BOOLEAN,
    previous_student: FIELD_TYPES.BOOLEAN,
    course_type: FIELD_TYPES.COURSE_TYPE,
    faculty_id: FIELD_TYPES.FACULTY,
    campus_id: FIELD_TYPES.CAMPUS,
    duration_weeks: FIELD_TYPES.NUMBER,
    study_load: FIELD_TYPES.STRING,
    day_night_classes: FIELD_TYPES.STRING,
    intake_date: FIELD_TYPES.DATE,
    accommodation_type_id: FIELD_TYPES.ACCOMMODATION_TYPE,
    room_size_id: FIELD_TYPES.ROOM_SIZE,
    accommodation_price_per_week: FIELD_TYPES.NUMBER,
    needs_transport: FIELD_TYPES.BOOLEAN,
};

// Get valid operators for a field type
export const getValidOperatorsForField = (fieldType) => {
    // Get all operators that support this field type
    return Object.entries(RULE_OPERATORS)
        .filter(([_, config]) => config.type.includes(fieldType))
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
};

// Format value based on field type
export const formatValueForField = (value, fieldType) => {
    switch (fieldType) {
        case FIELD_TYPES.NUMBER:
            return value === "" ? "" : Number(value);
        case FIELD_TYPES.DATE:
            return value; // Assuming date is already in correct format
        case FIELD_TYPES.BOOLEAN:
            return Boolean(value);
        default:
            return value;
    }
};

// Get input type for field
export const getInputTypeForField = (fieldType) => {
    switch (fieldType) {
        case FIELD_TYPES.NUMBER:
            return "number";
        case FIELD_TYPES.DATE:
            return "date";
        default:
            return "text";
    }
};
