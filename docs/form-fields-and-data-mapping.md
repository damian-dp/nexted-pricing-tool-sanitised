# Quote Form Fields and Data Mapping

This document outlines the naming conventions for form fields in the quote tool. Each field references or maps to the underlying database schema and logic.

### **Student Info**

| **Form Field**       | **Type**  | **Description / DB Mapping**                                     |
| -------------------- | --------- | ---------------------------------------------------------------- |
| `studentFirstName`   | `string`  | First name of the student (does not affect quote logic).         |
| `studentLastName`    | `string`  | Last name of the student (does not affect quote logic).          |
| `studentEmail`       | `string`  | Email address (does not affect quote logic).                     |
| `studentNationality` | `string`  | Maps to a `region` (based on `region_name` or `countries`).      |
| `studentAddress`     | `string`  | Residential address (does not affect quote logic).               |
| `hasStudentVisa`     | `boolean` | Used in logic equivalent to `student_visa` in rules.             |
| `isOffshore`         | `boolean` | Represents onshore/offshore status (maps to `onshore_offshore`). |
| `isPreviousStudent`  | `boolean` | Represents previous student status (maps to `previous_student`). |

<br>

### **Courses** (Repeatable Section)

Each course entry in the quote form will have these fields:

| **Form Field**     | **Type**                     | **Description / DB Mapping**                                                                                                                                                                                         |
| ------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `facultyName`      | `string` (dropdown)          | Maps to `faculties.faculty_name`. Used to filter which courses belong to a given faculty.                                                                                                                            |
| `courseName`       | `string` (dropdown)          | Maps to `course_detail.course_name`. Defines other constraints, like `duration_type` or `intake_dates`.                                                                                                              |
| `campusName`       | `string` (dropdown)          | Maps to `campus.campus_name`. Tied to `course_campus` to ensure the selected course is offered at that campus.                                                                                                       |
| `selectedDuration` | `number` or `'fixedOption'`  | - If `duration_type === 'weekly'`, user inputs a numeric week count.<br>- If `duration_type === 'fixed'`, user picks from preset durations.<br>Ultimately maps to `course_detail.duration_weeks` or a user override. |
| `intakeDate`       | `string` or `Date`           | Maps to one of `course_detail.intake_dates`.                                                                                                                                                                         |
| `studyLoad`        | `'full_time' \| 'part_time'` | Reflects `full_time_offered` / `part_time_offered`. If `part_time_offered` is false, disable part-time in the UI.                                                                                                    |
| `timetable`        | `'day' \| 'night'`           | Reflects `day_classes_offered` / `night_classes_offered`. If `night_classes_offered` is false, hide night option.                                                                                                    |

<br>

### **Accommodation & Transport**

| **Form Field**          | **Type**  | **Description / DB Mapping**                                        |
| ----------------------- | --------- | ------------------------------------------------------------------- |
| `accommodationType`     | `string`  | Maps to `accommodation_type.name`.                                  |
| `accommodationRoomSize` | `string`  | Maps to `room_size.name`. Valid combos are in `accommodation_room`. |
| `needsTransport`        | `boolean` | If `true`, apply transport-related rules; no separate table needed. |

<br>
<br>

# **Calculation Function Variables**

Below is a concise list of **key variables** the calculation function needs to properly evaluate rules based on user input and database lookups. Rules are now stored in a unified `rules` table with a `value_type` field indicating whether they are pricing, fee, or discount rules.

<br>

## **Variables**

| **Variable**           | **Type / Example**                  | **Derived From**                                                                                                                            | **Usage**                                                            |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `region_id`            | Integer (e.g., `1`)                 | From user selection of `studentNationality` → look up in `region` table (e.g., Australia => `region_id = 1`).                               | Applies region-based rules and pricing.                              |
| `onshore_offshore`     | String: `"onshore"` or `"offshore"` | From user selection of `isOffshore`: if `true`, `"offshore"`, else `"onshore"`.                                                             | Differentiates offshore/onshore rules.                               |
| `previous_student` | Boolean (default: `false`)          | From user selection of `isPreviousStudent`.                                                                                              | Applies previous student rules.                                  |
| `student_visa`         | Boolean (e.g., `true`)              | From user selection of `hasStudentVisa`.                                                                                                    | Applies visa-related rules.                                          |
| `course_id`            | Integer (e.g., `2`)                 | From user selection of `facultyName` + `courseName` → DB lookup in `course_detail`.                                                         | Identifies the chosen course for rule evaluation.                    |
| `course_type`          | String: `"VET"`, `"ENGLISH"`         | From `course_detail.course_type` in DB table once `course_id` is known.                                                                     | Many rules check if it is ENGLISH vs. VET.                            |
| `campus_id`            | Integer (e.g., `1`)                 | From user selection of `campusName` → DB lookup in `campus`.                                                                                | Some rules vary by campus.                                           |
| `duration_type`        | String: `"fixed"`, `"weekly"`       | From `course_detail.duration_type` in DB table once `course_id` is known.                                                                   | Tells if final pricing is per-week or a fixed base.                  |
| `duration_weeks`       | Number (e.g., `40`)                 | - If weekly, from user input.<br>- If fixed, from `course_detail.duration_weeks` array of fixed duration options (e.g., `52`).              | Used for per-week pricing or applying rules referencing total weeks. |
| `study_load`           | `"full_time"` or `"part_time"`      | Directly from user choice, validated against `full_time_offered` & `part_time_offered` in `course_detail` table.                            | Some rules apply differently based on full/part-time.                |
| `day_night_classes`    | `"day"` or `"night"`                | From `timetable` → must match `day_classes_offered` / `night_classes_offered` in `course_detail` table.                                     | Some rules vary by day/night schedule.                               |
| `intake_date`          | String/Date (e.g., `"2025-03-15"`)  | Picked from `course_detail.intake_dates` array in DB table.                                                                                 | Early bird discounts or date-based conditions.                       |
| `accommodation_type`   | String (e.g., `"Homestay"`)         | From user selection of `accommodationType` → look up in `accommodation_type` table.                                                         | For accommodation-based rules.                                       |
| `room_size`            | String (e.g., `"Single"`)           | From user selection of `accommodationRoomSize` → look up in `room_size` table validated against `accommodation_room` to ensure valid combo. | Rules for single vs. shared rooms, etc.                              |
| `needsTransport`       | Boolean (e.g., `true`)              | From user selection of `needsTransport` (yes/no).                                                                                           | If true, triggers transport-related rules.                           |

---

## **Summary of flow**

1. The **form** collects user inputs (e.g. `isOffshore`, `hasStudentVisa`, `isPreviousStudent`, `facultyName`, etc.).
2. **Lookups** (in `region`, `course_detail`, `campus`, etc.) produce the final IDs and additional fields (`course_type`, `duration_type`, etc.).
3. These ~13 **key variables** feed the calculation logic which evaluates rules from the unified `rules` table based on their `value_type` (pricing, fee, or discount) to generate a final quote.

Flow: **front-end** user selections → **database lookups** → **rule evaluation** → **final quote**.

# **Example - User Form**

```jsx
import React, { useState } from "react";

export default function QuoteForm() {
    // -----------------------------
    // 1. Student Info
    // -----------------------------
    const [studentFirstName, setStudentFirstName] = useState("");
    const [studentLastName, setStudentLastName] = useState("");
    const [studentEmail, setStudentEmail] = useState("");
    const [studentNationality, setStudentNationality] = useState("Australia");
    const [studentAddress, setStudentAddress] = useState("");
    const [hasStudentVisa, setHasStudentVisa] = useState(false);
    const [isPreviousStudent, setIsPreviousStudent] = useState(false);
    const [isOffshore, setIsOffshore] = useState(false);

    // -----------------------------
    // 2. Courses (repeated)
    // -----------------------------
    const [courses, setCourses] = useState([
        {
            facultyName: "",
            courseName: "",
            campusName: "",
            selectedDuration: "",
            intakeDate: "",
            studyLoad: "full_time", // or 'part_time'
            timetable: "day", // or 'night'
        },
    ]);

    // Function to add another course section
    function addCourse() {
        setCourses([
            ...courses,
            {
                facultyName: "",
                courseName: "",
                campusName: "",
                selectedDuration: "",
                intakeDate: "",
                studyLoad: "full_time",
                timetable: "day",
            },
        ]);
    }

    // Handler to update a single course field
    function updateCourseField(index, field, value) {
        const updated = [...courses];
        updated[index][field] = value;
        setCourses(updated);
    }

    // -----------------------------
    // 3. Accommodation & Transport
    // -----------------------------
    const [accommodationType, setAccommodationType] = useState("");
    const [accommodationRoomSize, setAccommodationRoomSize] = useState("");
    const [needsTransport, setNeedsTransport] = useState(false);

    // -----------------------------
    // 4. Building Quote Data
    // -----------------------------
    function buildQuoteData() {
        // Potentially do lookups to map facultyName -> faculty_id, etc.
        // For now, just returning the raw form data
        return {
            studentFirstName,
            studentLastName,
            studentEmail,
            studentNationality,
            studentAddress,
            hasStudentVisa,
            isOffshore,
            isPreviousStudent,
            courses,
            accommodationType,
            accommodationRoomSize,
            needsTransport,
        };
    }

    // -----------------------------
    // 5. Submit Handler
    // -----------------------------
    function handleSubmit(e) {
        e.preventDefault();
        const quoteData = buildQuoteData();
        console.log("Quote Data:", quoteData);
        // In real usage, send to server or evaluate locally
        // fetch("/api/generate-quote", { method: "POST", body: JSON.stringify(quoteData) })
        //   .then(...)
    }

    // -----------------------------
    // 6. Render the Form
    // -----------------------------
    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
            <h2 className="text-xl font-semibold">Student Info</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1">First Name</label>
                    <input
                        type="text"
                        value={studentFirstName}
                        onChange={(e) => setStudentFirstName(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block mb-1">Last Name</label>
                    <input
                        type="text"
                        value={studentLastName}
                        onChange={(e) => setStudentLastName(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block mb-1">Email</label>
                    <input
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block mb-1">Nationality</label>
                    <input
                        type="text"
                        value={studentNationality}
                        onChange={(e) => setStudentNationality(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="col-span-2">
                    <label className="block mb-1">Residential Address</label>
                    <input
                        type="text"
                        value={studentAddress}
                        onChange={(e) => setStudentAddress(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block mb-1">Has Student Visa?</label>
                    <input
                        type="checkbox"
                        checked={hasStudentVisa}
                        onChange={(e) => setHasStudentVisa(e.target.checked)}
                        className="mr-2"
                    />
                </div>
                <div>
                    <label className="block mb-1">Is Offshore?</label>
                    <input
                        type="checkbox"
                        checked={isOffshore}
                        onChange={(e) => setIsOffshore(e.target.checked)}
                        className="mr-2"
                    />
                </div>
                <div>
                    <label className="block mb-1">
                        Is Previous  Student?
                    </label>
                    <input
                        type="checkbox"
                        checked={isPreviousStudent}
                        onChange={(e) =>
                            setIsPreviousStudent(e.target.checked)
                        }
                        className="mr-2"
                    />
                </div>
            </div>

            <hr />

            <h2 className="text-xl font-semibold">Courses</h2>
            {courses.map((course, idx) => (
                <div key={idx} className="border p-4 mb-4 rounded-md">
                    <p className="font-bold mb-2">Course #{idx + 1}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1">Faculty</label>
                            <input
                                type="text"
                                value={course.facultyName}
                                onChange={(e) =>
                                    updateCourseField(
                                        idx,
                                        "facultyName",
                                        e.target.value
                                    )
                                }
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-1">Course</label>
                            <input
                                type="text"
                                value={course.courseName}
                                onChange={(e) =>
                                    updateCourseField(
                                        idx,
                                        "courseName",
                                        e.target.value
                                    )
                                }
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-1">Campus</label>
                            <input
                                type="text"
                                value={course.campusName}
                                onChange={(e) =>
                                    updateCourseField(
                                        idx,
                                        "campusName",
                                        e.target.value
                                    )
                                }
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-1">Duration</label>
                            <input
                                type="text"
                                value={course.selectedDuration}
                                onChange={(e) =>
                                    updateCourseField(
                                        idx,
                                        "selectedDuration",
                                        e.target.value
                                    )
                                }
                                className="w-full p-2 border rounded"
                                placeholder="e.g. 40 or '16 (fixed)'"
                            />
                        </div>
                        <div>
                            <label className="block mb-1">Intake Date</label>
                            <input
                                type="date"
                                value={course.intakeDate}
                                onChange={(e) =>
                                    updateCourseField(
                                        idx,
                                        "intakeDate",
                                        e.target.value
                                    )
                                }
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-1">Study Load</label>
                            <select
                                value={course.studyLoad}
                                onChange={(e) =>
                                    updateCourseField(
                                        idx,
                                        "studyLoad",
                                        e.target.value
                                    )
                                }
                                className="w-full p-2 border rounded"
                            >
                                <option value="full_time">Full-Time</option>
                                <option value="part_time">Part-Time</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1">
                                Timetable (Day/Night)
                            </label>
                            <select
                                value={course.timetable}
                                onChange={(e) =>
                                    updateCourseField(
                                        idx,
                                        "timetable",
                                        e.target.value
                                    )
                                }
                                className="w-full p-2 border rounded"
                            >
                                <option value="day">Day</option>
                                <option value="night">Night</option>
                            </select>
                        </div>
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={addCourse}
                className="py-1 px-3 bg-blue-600 text-white rounded"
            >
                Add Another Course
            </button>

            <hr />

            <h2 className="text-xl font-semibold">Accommodation & Transport</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1">Accommodation Type</label>
                    <input
                        type="text"
                        value={accommodationType}
                        onChange={(e) => setAccommodationType(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block mb-1">Room Size</label>
                    <input
                        type="text"
                        value={accommodationRoomSize}
                        onChange={(e) =>
                            setAccommodationRoomSize(e.target.value)
                        }
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block mb-1">Needs Transport?</label>
                    <input
                        type="checkbox"
                        checked={needsTransport}
                        onChange={(e) => setNeedsTransport(e.target.checked)}
                        className="mr-2"
                    />
                </div>
            </div>

            <hr />

            <button
                type="submit"
                className="mt-4 py-2 px-4 bg-green-600 text-white rounded"
            >
                Submit Quote
            </button>
        </form>
    );
}
```

<br>
<br>

# **Example - Evaluate Rules Function**

```js
/**
 * evaluateRuleConditions - Checks if a quote (data) satisfies a rule's conditions.
 * Supports operators: eq, ne, gt, gte, lt, lte, in, nin, like, notlike, ilike, nilike,
 * regex, between, before, after, exists, notexists, AND/OR/NOT logic.
 *
 * Usage Example:
 *   const matches = evaluateRuleConditions(rule.conditions, quoteData);
 *   if (matches) {
 *     // Apply the rule
 *   }
 */

/**
 * Main function that checks if the conditions object matches the quote data.
 * @param {Object|Array} conditions - The JSONB conditions from the rule.
 * @param {Object} data - The quote or any object to compare against.
 * @returns {boolean} True if all conditions pass, false otherwise.
 */
function evaluateRuleConditions(conditions, data) {
    // Handle compound logic, e.g. { OR: [ { field: { eq: val } }, ... ] }
    if (typeof conditions === "object" && !Array.isArray(conditions)) {
        // Check if top-level is AND/OR/NOT style
        if (Object.keys(conditions).length === 1 && conditions.OR) {
            // OR logic
            return conditions.OR.some((subCondition) =>
                evaluateRuleConditions(subCondition, data)
            );
        } else if (Object.keys(conditions).length === 1 && conditions.AND) {
            // AND logic
            return conditions.AND.every((subCondition) =>
                evaluateRuleConditions(subCondition, data)
            );
        } else if (Object.keys(conditions).length === 1 && conditions.NOT) {
            // NOT logic
            return !evaluateRuleConditions(conditions.NOT, data);
        }
    }

    // Otherwise assume all top-level fields are ANDed
    // e.g. { region_id: { eq: 1 }, student_visa: { eq: true } }
    return Object.entries(conditions).every(([fieldName, fieldCondition]) => {
        return evaluateFieldCondition(fieldName, fieldCondition, data);
    });
}

/**
 * Evaluates the condition(s) for a single field.
 * e.g. fieldCondition might be { eq: 3 } or { gte: 20, lte: 52 } or { like: 'Sydney' }
 * @param {string} fieldName - e.g. 'duration_weeks' or 'campus_id'
 * @param {Object} fieldCondition - e.g. { eq: 3 } or { gte: 20, lte: 52 }
 * @param {Object} data - The quote or object to compare against.
 * @returns {boolean} True if all sub-operators match, false otherwise.
 */
function evaluateFieldCondition(fieldName, fieldCondition, data) {
    // If we have dotted paths like 'student.visaStatus'
    const actualValue = getNestedValue(data, fieldName);

    // If the condition object has multiple operators (e.g. { gte: 20, lte: 52 })
    return Object.entries(fieldCondition).every(([operator, compareValue]) => {
        return evaluateOperator(actualValue, operator, compareValue);
    });
}

/**
 * Evaluates a single operator, e.g. eq, gt, ilike, etc.
 * @param {*} actualValue - The actual value from the data object.
 * @param {string} operator - e.g. 'eq', 'gt', 'lte', 'like', 'regex', etc.
 * @param {*} compareValue - The value specified in the rule's conditions.
 * @returns {boolean}
 */
function evaluateOperator(actualValue, operator, compareValue) {
    switch (operator) {
        case "eq":
            return actualValue === compareValue;
        case "ne":
            return actualValue !== compareValue;
        case "gt":
            return (
                parseNumberOrDate(actualValue) > parseNumberOrDate(compareValue)
            );
        case "gte":
            return (
                parseNumberOrDate(actualValue) >=
                parseNumberOrDate(compareValue)
            );
        case "lt":
            return (
                parseNumberOrDate(actualValue) < parseNumberOrDate(compareValue)
            );
        case "lte":
            return (
                parseNumberOrDate(actualValue) <=
                parseNumberOrDate(compareValue)
            );
        case "in":
            return (
                Array.isArray(compareValue) &&
                compareValue.includes(actualValue)
            );
        case "nin":
            return (
                Array.isArray(compareValue) &&
                !compareValue.includes(actualValue)
            );
        case "like":
            if (
                typeof actualValue !== "string" ||
                typeof compareValue !== "string"
            ) {
                return false;
            }
            return actualValue.indexOf(compareValue) !== -1;
        case "notlike":
            if (
                typeof actualValue !== "string" ||
                typeof compareValue !== "string"
            ) {
                return false;
            }
            return actualValue.indexOf(compareValue) === -1;
        case "ilike": {
            if (
                typeof actualValue !== "string" ||
                typeof compareValue !== "string"
            ) {
                return false;
            }
            const valLower = actualValue.toLowerCase();
            const compLower = compareValue.toLowerCase();
            return valLower.includes(compLower);
        }
        case "nilike": {
            if (
                typeof actualValue !== "string" ||
                typeof compareValue !== "string"
            ) {
                return false;
            }
            const valLower = actualValue.toLowerCase();
            const compLower = compareValue.toLowerCase();
            return !valLower.includes(compLower);
        }
        case "regex": {
            if (
                typeof actualValue !== "string" ||
                typeof compareValue !== "string"
            ) {
                return false;
            }
            const re = new RegExp(compareValue);
            return re.test(actualValue);
        }
        case "exists":
            // compareValue = true => must exist (not null/undefined)
            // actualValue is considered 'exists' if not undefined and not null
            return (
                !!compareValue ===
                (actualValue !== undefined && actualValue !== null)
            );
        case "notexists":
            // compareValue = true => must NOT exist
            // so if actualValue is null or undefined => pass
            return (
                !!compareValue ===
                (actualValue === undefined || actualValue === null)
            );
        case "between": {
            // compareValue should be an array [min, max]
            if (!Array.isArray(compareValue) || compareValue.length < 2)
                return false;
            const [min, max] = compareValue;
            const val = parseNumberOrDate(actualValue);
            return (
                val >= parseNumberOrDate(min) && val <= parseNumberOrDate(max)
            );
        }
        case "after": {
            // For dates: actualValue > compareValue
            const val = parseDate(actualValue);
            const comp = parseDate(compareValue);
            if (!val || !comp) return false;
            return val > comp;
        }
        case "before": {
            const val = parseDate(actualValue);
            const comp = parseDate(compareValue);
            if (!val || !comp) return false;
            return val < comp;
        }
        default:
            // Unknown operator => no match
            return false;
    }
}

/**
 * Safely retrieve nested values if fieldName has a dotted path (e.g. 'student.visaStatus').
 * @param {Object} obj
 * @param {string} path - dotted string
 * @returns {*} nested value or undefined
 */
function getNestedValue(obj, path) {
    if (!path.includes(".")) {
        return obj[path];
    }
    return path.split(".").reduce((acc, key) => {
        if (acc && typeof acc === "object") {
            return acc[key];
        }
        return undefined;
    }, obj);
}

/**
 * Attempts to parse a numeric or date-like value.
 * If parse fails, returns the original value for comparison.
 */
function parseNumberOrDate(value) {
    if (value === null || value === undefined) return value;

    // Try number first
    const num = Number(value);
    if (!isNaN(num)) return num;

    // Try date
    const dateObj = parseDate(value);
    return dateObj ? dateObj.valueOf() : value; // .valueOf() => ms since epoch
}

/**
 * Parses a string or Date input into a Date object, or returns null if invalid.
 */
function parseDate(input) {
    if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
    if (typeof input === "string") {
        const parsed = new Date(input);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}

module.exports = {
    evaluateRuleConditions,
};
```

<br>
<br>

# **Example - Calculate Final Quote Function**

```js
const { evaluateRuleConditions } = require("./evaluateRuleConditions");

/**
 * calculateFinalQuote
 *
 * Calculates the final quote for a single student submission, including:
 *  - Per-course pricing
 *  - Transport cost (if any)
 *  - Applicable fees
 *  - Applicable discounts
 * with line-by-line breakdown.
 *
 * @param {Object} quoteData - The data built from the form, plus any DB lookups
 * @param {Array} pricingRules - Array of pricing_rule records from DB
 * @param {Array} feeRules - Array of fee_rule records from DB
 * @param {Array} discountRules - Array of discount_rule records from DB
 * @returns {Object} { finalPrice, breakdown: [ { label, amount } ] }
 */
function calculateFinalQuote(quoteData, pricingRules, feeRules, discountRules) {
    let finalPrice = 0;
    const breakdown = [];

    // -----------------------------
    // 1. Calculate Price Per Course
    // -----------------------------
    // Suppose quoteData.courses is an array of selected courses, each with base or weekly pricing
    quoteData.courses.forEach((course, index) => {
        let coursePrice = 0;

        // Distinguish between 'fixed' and 'weekly' durations
        if (course.duration_type === "weekly") {
            coursePrice =
                (course.price_per_week || 0) *
                (Number(course.selectedDuration) || 0);
        } else {
            // For fixed, we might assume a base_price was fetched
            coursePrice = course.base_price || 0;
        }

        // Apply PRICING RULES specific to this course
        pricingRules.forEach((rule) => {
            // Merge top-level quoteData + current course to match conditions
            if (
                evaluateRuleConditions(rule.conditions, {
                    ...quoteData,
                    ...course,
                })
            ) {
                const oldPrice = coursePrice;
                if (rule.type === "fixed") {
                    coursePrice += Number(rule.value);
                } else if (rule.type === "percent") {
                    coursePrice += (coursePrice * Number(rule.value)) / 100;
                }
                // If you want partial breakdown per rule, you can push a line here
            }
        });

        // Add the resulting course price to the final
        finalPrice += coursePrice;

        // Add a line to breakdown
        breakdown.push({
            label: `Course #${index + 1}: ${course.courseName}`,
            amount: coursePrice,
        });
    });

    // -----------------------------
    // 2. Transport (if needed)
    // -----------------------------
    if (quoteData.needsTransport) {
        // Example: $200 transport cost
        const transportCost = XXX;
        finalPrice += transportCost;
        breakdown.push({
            label: "Transport",
            amount: transportCost,
        });
    }

    // -----------------------------
    // 3. Apply FEE RULES
    // -----------------------------
    feeRules.forEach((fee) => {
        if (evaluateRuleConditions(fee.conditions, quoteData)) {
            let feeAmount = 0;
            if (fee.type === "fixed") {
                feeAmount = Number(fee.value);
            } else if (fee.type === "percent") {
                feeAmount = finalPrice * (Number(fee.value) / 100);
            }
            finalPrice += feeAmount;
            breakdown.push({
                label: `Fee: ${fee.fee_name}`,
                amount: feeAmount,
            });
        }
    });

    // -----------------------------
    // 4. Apply DISCOUNT RULES
    // -----------------------------
    discountRules.forEach((discount) => {
        // Some discounts might apply to a course, or the entire quote
        // If course-specific, you could apply after each course. Alternatively, we do it here
        // and itemise it under the correct line. For simplicity, we do it at the end.
        if (evaluateRuleConditions(discount.conditions, quoteData)) {
            let discountAmount = 0;
            if (discount.type === "fixed") {
                discountAmount = Number(discount.value);
            } else if (discount.type === "percent") {
                discountAmount = finalPrice * (Number(discount.value) / 100);
            }
            finalPrice += discountAmount; // negative value reduces total
            breakdown.push({
                label: `Discount: ${discount.discount_name}`,
                amount: discountAmount,
            });
        }
    });

    // -----------------------------
    // Return Final
    // -----------------------------
    return {
        finalPrice,
        breakdown,
    };
}

module.exports = {
    calculateFinalQuote,
};
```
