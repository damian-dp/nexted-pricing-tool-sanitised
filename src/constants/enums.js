/**
 * Duration types for courses
 */
export const DURATION_TYPES = {
    FIXED: "fixed",
    WEEKLY: "weekly",
};

/**
 * Course types
 */
export const COURSE_TYPES = {
    VET: "VET",
    ELICOS: "ELICOS",
};

/**
 * Value types for rules
 */
export const RULE_VALUE_TYPES = {
    FIXED: "fixed",
    PERCENT: "percent",
};

/**
 * Types of entities that rules can apply to
 */
export const APPLIES_TO_TYPES = {
    // Course-related
    COURSE_PRICE: "course_price", // Base course price modifications
    COURSE_DISCOUNT: "course_discount", // Course-specific discounts

    // Accommodation-related
    ACCOMMODATION_PRICE: "accommodation_price", // Base accommodation price modifications
    ACCOMMODATION_DISCOUNT: "accommodation_discount", // Accommodation-specific discounts

    // Fees
    ENROLLMENT_FEE: "enrollment_fee", // Enrollment fee modifications
    MATERIAL_FEE: "material_fee", // Material fee modifications
    TOTAL_FEE: "total_fee", // Modifications to all fees together

    // Quote-wide
    TOTAL_PRICE: "total_price", // Modifications to final quote total
    TOTAL_DISCOUNT: "total_discount", // Quote-wide discounts
};

/**
 * Labels for applies to types
 */
export const APPLIES_TO_LABELS = {
    [APPLIES_TO_TYPES.COURSE_PRICE]: "Course Price",
    [APPLIES_TO_TYPES.COURSE_DISCOUNT]: "Course Discount",
    [APPLIES_TO_TYPES.ACCOMMODATION_PRICE]: "Accommodation Price",
    [APPLIES_TO_TYPES.ACCOMMODATION_DISCOUNT]: "Accommodation Discount",
    [APPLIES_TO_TYPES.ENROLLMENT_FEE]: "Enrollment Fee",
    [APPLIES_TO_TYPES.MATERIAL_FEE]: "Material Fee",
    [APPLIES_TO_TYPES.TOTAL_FEE]: "Total Fees",
    [APPLIES_TO_TYPES.TOTAL_PRICE]: "Total Price",
    [APPLIES_TO_TYPES.TOTAL_DISCOUNT]: "Total Discount",
};

/**
 * Study load options
 */
export const STUDY_LOAD = {
    FULL_TIME: "full_time",
    PART_TIME: "part_time",
};

export const STUDY_LOAD_LABELS = {
    [STUDY_LOAD.FULL_TIME]: "Full Time",
    [STUDY_LOAD.PART_TIME]: "Part Time",
};

/**
 * Class schedule options
 */
export const CLASS_SCHEDULE = {
    DAY: "day",
    NIGHT: "night",
};

export const CLASS_SCHEDULE_LABELS = {
    [CLASS_SCHEDULE.DAY]: "Day Classes",
    [CLASS_SCHEDULE.NIGHT]: "Night Classes",
};

/**
 * Transport options
 */
export const TRANSPORT = {
    NEEDED: "needed",
    NOT_NEEDED: "not_needed",
};

export const TRANSPORT_LABELS = {
    [TRANSPORT.NEEDED]: "Transport Needed",
    [TRANSPORT.NOT_NEEDED]: "No Transport Needed",
};

/**
 * Student location options
 */
export const ONSHORE_OFFSHORE = {
    ONSHORE: "onshore",
    OFFSHORE: "offshore",
};

export const ONSHORE_OFFSHORE_LABELS = {
    [ONSHORE_OFFSHORE.ONSHORE]: "Onshore",
    [ONSHORE_OFFSHORE.OFFSHORE]: "Offshore",
};

/**
 * Database table names
 */
export const DB_TABLES = {
    ACCOMMODATION_TYPES: "accommodation_types",
    ROOM_SIZE: "room_size",
    ACCOMMODATION_ROOM: "accommodation_room",
    COURSE_DETAIL: "course_detail",
    COURSE_PRICE: "course_price",
    COURSE_CAMPUS: "course_campus",
    CAMPUS: "campus",
    FACULTIES: "faculties",
    REGION: "region",
    RULES: "rules",
    QUOTES: "quotes",
    ORGANISATIONS: "organisations",
};

/**
 * Database field names by table
 */
export const DB_FIELDS = {
    // Accommodation Types
    ACCOMMODATION_TYPES: {
        ID: "id",
        NAME: "name",
        DESCRIPTION: "description",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },

    // Room Size
    ROOM_SIZE: {
        ID: "id",
        NAME: "name",
        DESCRIPTION: "description",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },

    // Accommodation Room (join table)
    ACCOMMODATION_ROOM: {
        ACCOMMODATION_TYPE_ID: "accommodation_type_id",
        ROOM_SIZE_ID: "room_size_id",
        PRICE_PER_WEEK: "price_per_week",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },

    // Course Detail
    COURSE_DETAIL: {
        ID: "id",
        COURSE_NAME: "course_name",
        COURSE_IDENTIFIER: "course_identifier",
        FACULTY_ID: "faculty_id",
        DURATION_TYPE: "duration_type",
        DURATION_WEEKS: "duration_weeks",
        FULL_TIME_OFFERED: "full_time_offered",
        PART_TIME_OFFERED: "part_time_offered",
        NIGHT_CLASSES_OFFERED: "night_classes_offered",
        DAY_CLASSES_OFFERED: "day_classes_offered",
        INTAKE_DATES: "intake_dates",
        COURSE_TYPE: "course_type",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },

    // Course Price
    COURSE_PRICE: {
        ID: "id",
        COURSE_DETAILS_ID: "course_details_id",
        REGION_ID: "region_id",
        BASE_PRICE: "base_price",
        PRICE_PER_WEEK: "price_per_week",
        PRICE_START_DATE: "price_start_date",
        PRICE_END_DATE: "price_end_date",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },

    // Course Campus (join table)
    COURSE_CAMPUS: {
        COURSE_ID: "course_id",
        CAMPUS_ID: "campus_id",
        CREATED_AT: "created_at",
    },

    // Campus
    CAMPUS: {
        ID: "id",
        CAMPUS_NAME: "campus_name",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },

    // Faculties
    FACULTIES: {
        ID: "id",
        FACULTY_NAME: "faculty_name",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },

    // Region
    REGION: {
        ID: "id",
        REGION_NAME: "region_name",
        COUNTRIES: "countries",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },

    // Quotes
    QUOTES: {
        ID: "id",
        QUOTE_INPUT: "quote_input",
        QUOTE_OUTPUT: "quote_output",
        COMMISSION_TOTAL: "commission_total",
        METADATA: "metadata",
        CLERK_ID: "clerk_id",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },

    // Organisations
    ORGANISATIONS: {
        ID: "id",
        NAME: "name",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },

    // Rules
    RULES: {
        ID: "id",
        RULE_NAME: "rule_name",
        RULE_DESCRIPTION: "rule_description",
        APPLIES_TO: "applies_to",
        START_DATE: "start_date",
        END_DATE: "end_date",
        VALUE_TYPE: "value_type",
        VALUE: "value",
        CONDITIONS: "conditions",
        RULE_TYPE: "rule_type",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },

    // Common fields
    COMMON: {
        ID: "id",
        CREATED_AT: "created_at",
        UPDATED_AT: "updated_at",
    },
};

/**
 * Database field types
 */
export const DB_FIELD_TYPES = {
    UUID: "uuid",
    TEXT: "text",
    NUMERIC: "numeric",
    BOOLEAN: "boolean",
    TIMESTAMP: "timestamp with time zone",
    DATE: "date",
    JSONB: "jsonb",
    ARRAY: "ARRAY",
};

/**
 * Rule status types
 */
export const RULE_STATUS = {
    DRAFT: "draft",
    UPCOMING: "upcoming",
    ACTIVE: "active",
    EXPIRED: "expired",
};

export const RULE_STATUS_LABELS = {
    [RULE_STATUS.DRAFT]: "Draft",
    [RULE_STATUS.UPCOMING]: "Upcoming",
    [RULE_STATUS.ACTIVE]: "Active",
    [RULE_STATUS.EXPIRED]: "Expired",
};

/**
 * Quote status types
 */
export const QUOTE_STATUS = {
    DRAFT: "draft",
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    EXPIRED: "expired",
};

export const QUOTE_STATUS_LABELS = {
    [QUOTE_STATUS.DRAFT]: "Draft",
    [QUOTE_STATUS.PENDING]: "Pending",
    [QUOTE_STATUS.APPROVED]: "Approved",
    [QUOTE_STATUS.REJECTED]: "Rejected",
    [QUOTE_STATUS.EXPIRED]: "Expired",
};

/**
 * Order in which rules should be calculated
 * @type {string[]}
 */
export const RULE_CALCULATION_ORDER = [
    APPLIES_TO_TYPES.COURSE_PRICE, // 1. Base course price modifications
    APPLIES_TO_TYPES.ACCOMMODATION_PRICE, // 2. Base accommodation price modifications
    APPLIES_TO_TYPES.COURSE_DISCOUNT, // 3. Course-specific discounts
    APPLIES_TO_TYPES.ACCOMMODATION_DISCOUNT, // 4. Accommodation-specific discounts
    APPLIES_TO_TYPES.ENROLLMENT_FEE, // 5. Enrollment fee modifications
    APPLIES_TO_TYPES.MATERIAL_FEE, // 6. Material fee modifications
    APPLIES_TO_TYPES.TOTAL_FEE, // 7. Total fees modifications
    APPLIES_TO_TYPES.TOTAL_PRICE, // 8. Final price modifications
    APPLIES_TO_TYPES.TOTAL_DISCOUNT, // 9. Quote-wide discounts
];

/**
 * Database operator types (from database enums)
 */
export const DB_OPERATORS = {
    // From equality_op enum
    EQUALITY: {
        EQ: "eq",
        NEQ: "neq",
        LT: "lt",
        LTE: "lte",
        GT: "gt",
        GTE: "gte",
        IN: "in",
        NIN: "nin",
    },
    // From string_op enum
    STRING: {
        LIKE: "like",
        NOT_LIKE: "notlike",
        ILIKE: "ilike",
        NOT_ILIKE: "nilike",
        REGEX: "regex",
    },
    // From date_op enum
    DATE: {
        BEFORE: "before",
        AFTER: "after",
        BETWEEN: "between",
    },
    // From existence_op enum
    EXISTENCE: {
        EXISTS: "exists",
        NOT_EXISTS: "notexists",
    },
};

/**
 * Rule operators with their labels and supported types
 */
export const RULE_OPERATORS = {
    // Equality operators
    [DB_OPERATORS.EQUALITY.EQ]: {
        label: (fieldType) => (fieldType === "date" ? "on" : "equal to"),
        type: [
            "number",
            "boolean",
            "campus",
            "faculty",
            "course_type",
            "accommodation_type",
            "room_size",
            "region",
            "string_option",
            "date",
        ],
    },
    [DB_OPERATORS.EQUALITY.NEQ]: {
        label: (fieldType) =>
            fieldType === "date" ? "not on" : "not equal to",
        type: [
            "number",
            "boolean",
            "campus",
            "faculty",
            "course_type",
            "accommodation_type",
            "room_size",
            "region",
            "string_option",
            "date",
        ],
    },
    [DB_OPERATORS.EQUALITY.GT]: {
        label: (fieldType) => (fieldType === "date" ? "after" : "greater than"),
        type: ["number", "date"],
    },
    [DB_OPERATORS.EQUALITY.GTE]: {
        label: (fieldType) =>
            fieldType === "date" ? "on or after" : "greater than or equal to",
        type: ["number", "date"],
    },
    [DB_OPERATORS.EQUALITY.LT]: {
        label: (fieldType) => (fieldType === "date" ? "before" : "less than"),
        type: ["number", "date"],
    },
    [DB_OPERATORS.EQUALITY.LTE]: {
        label: (fieldType) =>
            fieldType === "date" ? "on or before" : "less than or equal to",
        type: ["number", "date"],
    },
    [DB_OPERATORS.EQUALITY.IN]: {
        label: "one of",
        type: [],
    },
    [DB_OPERATORS.EQUALITY.NIN]: {
        label: "not one of",
        type: [],
    },

    // String operators
    [DB_OPERATORS.STRING.LIKE]: {
        label: "containing (case sensitive)",
        type: ["string"],
    },
    [DB_OPERATORS.STRING.NOT_LIKE]: {
        label: "not containing (case sensitive)",
        type: ["string"],
    },
    [DB_OPERATORS.STRING.ILIKE]: {
        label: "containing",
        type: ["string"],
    },
    [DB_OPERATORS.STRING.NOT_ILIKE]: {
        label: "not containing",
        type: ["string"],
    },
    [DB_OPERATORS.STRING.REGEX]: {
        label: "matching pattern",
        type: ["string"],
    },

    // Date operators
    [DB_OPERATORS.DATE.BEFORE]: {
        label: "before",
        type: ["date"],
    },
    [DB_OPERATORS.DATE.AFTER]: {
        label: "after",
        type: ["date"],
    },
    [DB_OPERATORS.DATE.BETWEEN]: {
        label: "between",
        type: ["date"],
    },
};

/**
 * Rule validation function to ensure value type and applies_to combinations make sense
 */
export const isValidRuleValueCombo = (valueType, appliesTo, value) => {
    // Discounts must have negative values
    if (appliesTo.includes("discount") && value >= 0) {
        return false;
    }

    // Percentage values must be between -100 and 100
    if (valueType === RULE_VALUE_TYPES.PERCENT) {
        return value >= -100 && value <= 100;
    }

    return true;
};

/**
 * Logical operators for rule condition groups
 */
export const RULE_GROUP_OPERATORS = {
    AND: "AND",
    OR: "OR",
};

export const RULE_GROUP_OPERATOR_LABELS = {
    [RULE_GROUP_OPERATORS.AND]: "All",
    [RULE_GROUP_OPERATORS.OR]: "Any",
};

/**
 * Rule field definitions with their types and options
 */
export const RULE_FIELDS = {
    region_id: {
        label: "Region",
        type: "region",
        dynamicOptions: true,
    },
    onshore_offshore: {
        label: "Onshore/offshore",
        type: "string_option",
        options: [ONSHORE_OFFSHORE.ONSHORE, ONSHORE_OFFSHORE.OFFSHORE],
    },
    student_visa: {
        label: "Student visa",
        type: "boolean",
    },
    previous_student: {
        label: "Previous student",
        type: "boolean",
    },
    course_type: {
        label: "Course type",
        type: "string_option",
        options: [COURSE_TYPES.VET, COURSE_TYPES.ELICOS],
    },
    faculty_id: {
        label: "Faculty",
        type: "faculty",
        dynamicOptions: true,
    },
    campus_id: {
        label: "Campus",
        type: "campus",
        dynamicOptions: true,
    },
    duration_weeks: {
        label: "Duration (weeks)",
        type: "number",
    },
    study_load: {
        label: "Study load",
        type: "string_option",
        options: [STUDY_LOAD.FULL_TIME, STUDY_LOAD.PART_TIME],
    },
    day_night_classes: {
        label: "Class schedule",
        type: "string_option",
        options: [CLASS_SCHEDULE.DAY, CLASS_SCHEDULE.NIGHT],
    },
    intake_date: {
        label: "Intake date",
        type: "date",
    },
    accommodation_type_id: {
        label: "Accommodation",
        type: "accommodation_type",
        dynamicOptions: true,
    },
    room_size_id: {
        label: "Room size",
        type: "room_size",
        dynamicOptions: true,
    },
    accommodation_price_per_week: {
        label: "Accom price p/w",
        type: "number",
    },
    needs_transport: {
        label: "Transport required",
        type: "boolean",
    },
};
