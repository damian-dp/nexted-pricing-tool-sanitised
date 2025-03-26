# Rule Condition Operators Reference

This document outlines how the **Quote Tool** evaluates rule conditions stored in the database. Each rule in the `rules` table has a `conditions` field (in JSON format) specifying operators and values to match against a quote. Below is a **single, unified** reference table of all supported operators.

<br>

## **1. Master Operator Table**

| **Operator** | **Meaning**                                              | **Expected Data Type(s)**       | **Example JSON**                             | **Example Evaluation**                                                            |
| ------------ | -------------------------------------------------------- | ------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------- |
| **after**    | **Date is strictly after** the given date                | Date, String (parse as date)    | `"intakeDate": { "after": "2025-01-01" }`    | Matches if `intakeDate` > `2025-01-01`                                            |
| **before**   | **Date is strictly before** the given date               | Date, String (parse as date)    | `"intakeDate": { "before": "2025-12-31" }`   | Matches if `intakeDate` < `2025-12-31`                                            |
| **between**  | **Value is between** two values (inclusive or exclusive) | Number or Date                  | `"duration_weeks": { "between": [20, 52] }`  | Matches if `20 <= duration_weeks <= 52` (implementation can vary for inclusively) |
| **eq**       | **Equals** (strict equality)                             | Number, String, Boolean         | `"duration_weeks": { "eq": 32 }`             | Matches if `duration_weeks === 32`                                                |
| **exists**   | **Field exists** (not null/undefined)                    | Boolean (true means must exist) | `"accommodation": { "exists": true }`        | Matches if `quoteInput.accommodation` is present and not null                     |
| **gt**       | **Greater Than**                                         | Number, Date                    | `"duration_weeks": { "gt": 32 }`             | Matches if `duration_weeks > 32`                                                  |
| **gte**      | **Greater Than or Equals**                               | Number, Date                    | `"duration_weeks": { "gte": 32 }`            | Matches if `duration_weeks >= 32`                                                 |
| **ilike**    | **Case-insensitive partial string match**                | String                          | `"campusName": { "ilike": "melbourne" }`     | Matches if `campusName` contains `"melbourne"`, ignoring case                     |
| **in**       | **Included In** (array membership)                       | Number, String, Boolean         | `"region_id": { "in": [1, 2, 3] }`           | Matches if `region_id` ∈ `[1,2,3]`                                                |
| **like**     | **Partial string match** (case-sensitive or as defined)  | String                          | `"campusName": { "like": "Sydney" }`         | Matches if `campusName` contains `"Sydney"`                                       |
| **lt**       | **Less Than**                                            | Number, Date                    | `"duration_weeks": { "lt": 52 }`             | Matches if `duration_weeks < 52`                                                  |
| **lte**      | **Less Than or Equals**                                  | Number, Date                    | `"duration_weeks": { "lte": 52 }`            | Matches if `duration_weeks <= 52`                                                 |
| **neq**      | **Not Equals**                                           | Number, String, Boolean         | `"course_type": { "neq": "VET" }`            | Matches if `course_type !== "VET"`                                                |
| **nin**      | **Not Included In** (array membership)                   | Number, String, Boolean         | `"course_type": { "nin": ["ENGLISH","VET"] }` | Matches if `course_type` is not `"ENGLISH"` and not `"VET"`                        |
| **nilike**   | **Negative case-insensitive partial string match**       | String                          | `"campusName": { "nilike": "melbourne" }`    | Matches if `campusName` does not contain `"melbourne"`, ignoring case             |
