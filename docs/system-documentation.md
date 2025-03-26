# NEXTED Pricing Tool System Documentation

## Related Documentation

This document is part of a set of documentation files for the NEXTED Pricing Tool:

-   **[Pricing Tool Project Overview](./quote-tool-project-overview.md)** - High-level overview of the Pricing Tool project, its purpose, and technology stack
-   **[Quote Generation Examples](./quote-generation-examples.md)** - Examples of quote inputs and outputs with detailed calculation steps
-   **[Quote Form Fields and Data Mapping](./quote-form-fields-and-data-mapping.md)** - Detailed documentation of form fields and their mapping to database schema
-   **[Rule Condition Operators Reference](./rule-condition-operators-reference.md)** - Reference for operators used in rule conditions and how they're evaluated
-   **This Document** - Comprehensive technical documentation of the system's backend components

This document provides a comprehensive overview of the NEXTED Pricing Tool application's backend system, including the Supabase database structure, Edge Functions, authentication flow, and quote generation logic. It includes detailed information about tables, fields, relationships, indexes, RLS policies, functions, triggers, custom types, and implementation details.

## Table of Contents

-   [Related Documentation](#related-documentation)
-   [Overview](#overview)
-   [Tables](#tables)
-   [Relationships](#relationships)
-   [Custom Types](#custom-types)
-   [Row Level Security Policies](#row-level-security-policies)
-   [Functions](#functions)
-   [Triggers](#triggers)
-   [Indexes](#indexes)
-   [PostgreSQL Extensions](#postgresql-extensions)
-   [Check Constraints](#check-constraints)
-   [Usage Examples](#usage-examples)
-   [Performance Considerations](#performance-considerations)
-   [Data Lifecycle Management](#data-lifecycle-management)
-   [Data Transformation](#data-transformation)
-   [Clerk Integration & Authentication](#clerk-integration--authentication)
-   [Edge Functions](#edge-functions)
-   [Quote Generation Functions](#quote-generation-functions)

## Overview

The database is structured around a quote generation system for educational courses and accommodations. It includes tables for managing courses, pricing, accommodations, organisations, and quotes. The system implements Row Level Security (RLS) to control access to data based on user roles. Authentication and user management are handled by Clerk, with JWT tokens used to validate user access in Supabase.

## Tables

### accommodation_room

Junction table linking accommodation types with room sizes and their pricing.

| Column Name           | Data Type                | Nullable | Default | Description                                          |
| --------------------- | ------------------------ | -------- | ------- | ---------------------------------------------------- |
| accommodation_type_id | uuid                     | NO       |         | Foreign key to accommodation_type                    |
| room_size_id          | uuid                     | NO       |         | Foreign key to room_size                             |
| price_per_week        | numeric                  | NO       |         | Weekly price for this accommodation/room combination |
| created_at            | timestamp with time zone | YES      | now()   | Creation timestamp                                   |
| updated_at            | timestamp with time zone | YES      | now()   | Last update timestamp                                |

Primary Key: (accommodation_type_id, room_size_id)

### accommodation_type

Defines different types of accommodations available.

| Column Name | Data Type                | Nullable | Default            | Description                           |
| ----------- | ------------------------ | -------- | ------------------ | ------------------------------------- |
| id          | uuid                     | NO       | uuid_generate_v4() | Primary key                           |
| name        | text                     | NO       |                    | Accommodation type name               |
| description | text                     | YES      |                    | Description of the accommodation type |
| created_at  | timestamp with time zone | YES      | now()              | Creation timestamp                    |
| updated_at  | timestamp with time zone | YES      | now()              | Last update timestamp                 |

Primary Key: id

### campus

Represents educational campuses.

| Column Name | Data Type                | Nullable | Default            | Description           |
| ----------- | ------------------------ | -------- | ------------------ | --------------------- |
| id          | uuid                     | NO       | uuid_generate_v4() | Primary key           |
| campus_name | text                     | NO       |                    | Name of the campus    |
| created_at  | timestamp with time zone | YES      | now()              | Creation timestamp    |
| updated_at  | timestamp with time zone | YES      | now()              | Last update timestamp |

Primary Key: id

### course_campus

Junction table linking courses to campuses where they are offered.

| Column Name | Data Type                | Nullable | Default | Description                  |
| ----------- | ------------------------ | -------- | ------- | ---------------------------- |
| course_id   | uuid                     | NO       |         | Foreign key to course_detail |
| campus_id   | uuid                     | NO       |         | Foreign key to campus        |
| created_at  | timestamp with time zone | YES      | now()   | Creation timestamp           |

Primary Key: (course_id, campus_id)

### course_detail

Contains detailed information about educational courses.

| Column Name           | Data Type                    | Nullable | Default            | Description                        |
| --------------------- | ---------------------------- | -------- | ------------------ | ---------------------------------- |
| id                    | uuid                         | NO       | uuid_generate_v4() | Primary key                        |
| course_name           | text                         | NO       |                    | Name of the course                 |
| course_identifier     | text                         | NO       |                    | Unique identifier for the course   |
| faculty_id            | uuid                         | YES      |                    | Foreign key to faculties           |
| duration_type         | USER-DEFINED (duration_type) | NO       |                    | Type of duration (fixed or weekly) |
| duration_weeks        | ARRAY                        | YES      |                    | Array of possible duration weeks   |
| full_time_offered     | boolean                      | NO       | false              | Whether full-time study is offered |
| part_time_offered     | boolean                      | NO       | false              | Whether part-time study is offered |
| night_classes_offered | boolean                      | NO       | false              | Whether night classes are offered  |
| day_classes_offered   | boolean                      | NO       | false              | Whether day classes are offered    |
| intake_dates          | ARRAY                        | NO       |                    | Array of intake dates              |
| course_type           | USER-DEFINED (course_type)   | NO       |                    | Type of course (VET or ENGLISH)    |
| created_at            | timestamp with time zone     | YES      | now()              | Creation timestamp                 |
| updated_at            | timestamp with time zone     | YES      | now()              | Last update timestamp              |

Primary Key: id

### course_price

Stores pricing information for courses.

| Column Name       | Data Type                | Nullable | Default            | Description                           |
| ----------------- | ------------------------ | -------- | ------------------ | ------------------------------------- |
| id                | uuid                     | NO       | uuid_generate_v4() | Primary key                           |
| course_details_id | uuid                     | YES      |                    | Foreign key to course_detail          |
| region_id         | uuid                     | YES      |                    | Foreign key to region                 |
| base_price        | numeric                  | YES      |                    | Base price of the course              |
| price_per_week    | numeric                  | YES      |                    | Weekly price for the course           |
| price_start_date  | date                     | NO       | CURRENT_DATE       | Date when the price becomes effective |
| price_end_date    | date                     | YES      |                    | Date when the price expires           |
| created_at        | timestamp with time zone | YES      | now()              | Creation timestamp                    |
| updated_at        | timestamp with time zone | YES      | now()              | Last update timestamp                 |

Primary Key: id

### rules

Defines all types of rules (pricing, fee, discount) for quote calculations.

| Column Name      | Data Type                      | Nullable | Default            | Description                           |
| ---------------- | ------------------------------ | -------- | ------------------ | ------------------------------------- |
| id               | uuid                           | NO       | uuid_generate_v4() | Primary key                           |
| rule_name        | text                           | NO       |                    | Name of the rule                      |
| rule_description | text                           | NO       |                    | Description of the rule               |
| applies_to       | USER-DEFINED (applies_to_type) | NO       |                    | What the rule applies to              |
| start_date       | date                           | NO       | CURRENT_DATE       | Date when the rule becomes effective  |
| end_date         | date                           | YES      |                    | Date when the rule expires            |
| value_type       | USER-DEFINED (value_type)      | NO       |                    | Type of rule (fixed or percentage)    |
| value            | numeric                        | NO       |                    | Value of the rule                     |
| conditions       | jsonb                          | NO       | '{}'               | JSON conditions for applying the rule |
| created_at       | timestamp with time zone       | YES      | now()              | Creation timestamp                    |
| updated_at       | timestamp with time zone       | YES      | now()              | Last update timestamp                 |

Primary Key: id

### organisations

Represents organisations that users belong to.

| Column Name | Data Type                | Nullable | Default            | Description              |
| ----------- | ------------------------ | -------- | ------------------ | ------------------------ |
| id          | uuid                     | NO       | uuid_generate_v4() | Primary key              |
| name        | text                     | NO       |                    | Name of the organisation |
| created_at  | timestamp with time zone | YES      | now()              | Creation timestamp       |
| updated_at  | timestamp with time zone | YES      | now()              | Last update timestamp    |

Primary Key: id

### quotes

Stores quote information generated by users.

| Column Name      | Data Type                | Nullable | Default            | Description                       |
| ---------------- | ------------------------ | -------- | ------------------ | --------------------------------- |
| id               | uuid                     | NO       | uuid_generate_v4() | Primary key                       |
| clerk_id         | text                     | NO       |                    | Clerk generated user ID           |
| quote_input      | jsonb                    | NO       |                    | Input data for the quote          |
| quote_output     | jsonb                    | NO       |                    | Generated quote output            |
| commission_total | numeric                  | YES      |                    | Total commission amount           |
| metadata         | jsonb                    | YES      | '{}'               | Additional metadata for the quote |
| created_at       | timestamp with time zone | YES      | now()              | Creation timestamp                |
| updated_at       | timestamp with time zone | YES      | now()              | Last update timestamp             |

Primary Key: id

### region

Represents geographical regions for pricing and rules.

| Column Name | Data Type                | Nullable | Default            | Description                      |
| ----------- | ------------------------ | -------- | ------------------ | -------------------------------- |
| id          | uuid                     | NO       | uuid_generate_v4() | Primary key                      |
| region_name | text                     | NO       |                    | Name of the region               |
| countries   | ARRAY                    | NO       |                    | Array of countries in the region |
| created_at  | timestamp with time zone | YES      | now()              | Creation timestamp               |
| updated_at  | timestamp with time zone | YES      | now()              | Last update timestamp            |

Primary Key: id

### room_size

Defines different room sizes for accommodations.

| Column Name | Data Type                | Nullable | Default            | Description                  |
| ----------- | ------------------------ | -------- | ------------------ | ---------------------------- |
| id          | uuid                     | NO       | uuid_generate_v4() | Primary key                  |
| name        | text                     | NO       |                    | Name of the room size        |
| description | text                     | YES      |                    | Description of the room size |
| created_at  | timestamp with time zone | YES      | now()              | Creation timestamp           |
| updated_at  | timestamp with time zone | YES      | now()              | Last update timestamp        |

Primary Key: id

## Relationships

### Foreign Keys

| Table              | Column                | References         | Referenced Column |
| ------------------ | --------------------- | ------------------ | ----------------- |
| accommodation_room | accommodation_type_id | accommodation_type | id                |
| accommodation_room | room_size_id          | room_size          | id                |
| course_campus      | campus_id             | campus             | id                |
| course_campus      | course_id             | course_detail      | id                |
| course_detail      | faculty_id            | faculties          | id                |
| course_price       | course_details_id     | course_detail      | id                |
| course_price       | region_id             | region             | id                |
| rules              | region_id             | region             | id                |

## Custom Types

### applies_to_type (ENUM)

-   course_price
-   accommodation
-   offshore_onshore
-   enrollment
-   enrolment_fee
-   total_price
-   duration_weeks
-   total_fee

### course_type (ENUM)

-   VET
-   ENGLISH

### date_op (ENUM)

-   before
-   after
-   between

### duration_type (ENUM)

-   fixed
-   weekly

### equality_op (ENUM)

-   eq
-   neq
-   lt
-   lte
-   gt
-   gte
-   in
-   nin

### existence_op (ENUM)

-   exists
-   notexists

### value_type (ENUM)

-   fixed
-   percentage

### user_role (ENUM)

-   admin
-   agent
-   manager

## Row Level Security Policies

### accommodation_room

-   **Accommodation room relationships are viewable by everyone**: Allows SELECT for anon and authenticated roles
-   **Accommodation room relationships are insertable by admins**: Allows INSERT for authenticated users who are admins
-   **Accommodation room relationships are updatable by admins**: Allows UPDATE for authenticated users who are admins
-   **Accommodation room relationships are deletable by admins**: Allows DELETE for authenticated users who are admins

### accommodation_type

-   **Accommodation types are viewable by everyone**: Allows SELECT for anon and authenticated roles
-   **Accommodation types are insertable by admins**: Allows INSERT for authenticated users who are admins
-   **Accommodation types are updatable by admins**: Allows UPDATE for authenticated users who are admins
-   **Accommodation types are deletable by admins**: Allows DELETE for authenticated users who are admins

### campus

-   **Core tables are viewable by everyone**: Allows SELECT for anon and authenticated roles
-   **Core tables are modifiable by admins**: Allows ALL operations for authenticated users who are admins

### course_campus

-   **Course campus relationships are viewable by everyone**: Allows SELECT for anon and authenticated roles
-   **Course campus relationships are insertable by admins**: Allows INSERT for authenticated users who are admins
-   **Course campus relationships are updatable by admins**: Allows UPDATE for authenticated users who are admins
-   **Course campus relationships are deletable by admins**: Allows DELETE for authenticated users who are admins

### course_detail

-   **Course details are viewable by everyone**: Allows SELECT for anon and authenticated roles
-   **Course details are insertable by admins**: Allows INSERT for authenticated users who are admins
-   **Course details are updatable by admins**: Allows UPDATE for authenticated users who are admins
-   **Course details are deletable by admins**: Allows DELETE for authenticated users who are admins

### course_price

-   **Course prices are viewable by everyone**: Allows SELECT for anon and authenticated roles
-   **Course prices are insertable by admins**: Allows INSERT for authenticated users who are admins
-   **Course prices are updatable by admins**: Allows UPDATE for authenticated users who are admins
-   **Course prices are deletable by admins**: Allows DELETE for authenticated users who are admins

### rules

-   **Rules are viewable by everyone**: Allows SELECT for anon and authenticated roles
-   **Rules are insertable by admins**: Allows INSERT for authenticated users who are admins
-   **Rules are updatable by admins**: Allows UPDATE for authenticated users who are admins
-   **Rules are deletable by admins**: Allows DELETE for authenticated users who are admins

### organisations

-   **Users can view all organisations**: Allows SELECT for public role
-   **Admins and managers can create organisations**: Allows INSERT for users with admin or manager roles
-   **Admins and managers can update any organisation**: Allows UPDATE for users with admin or manager roles
-   **Service role has full access to organisations**: Allows ALL operations for service_role
-   **service_role_access**: Allows ALL operations for service_role

### quotes

-   **Users can view their own quotes**: Allows SELECT for authenticated users on their own quotes (where clerk_id matches requesting_user_id())
-   **Admins and managers can view all quotes**: Allows SELECT for users with admin or manager roles on all quotes
-   **Users can create quotes**: Allows INSERT for authenticated users
-   **Users can update their own quotes**: Allows UPDATE for authenticated users on their own quotes
-   **Admins can update all quotes**: Allows UPDATE for users with admin role on all quotes
-   **Users can delete their own quotes**: Allows DELETE for authenticated users on their own quotes
-   **Admins can delete all quotes**: Allows DELETE for users with admin role on all quotes

### region

-   **Core tables are viewable by everyone**: Allows SELECT for anon and authenticated roles
-   **Core tables are modifiable by admins**: Allows ALL operations for authenticated users who are admins

### room_size

-   **Room sizes are viewable by everyone**: Allows SELECT for anon and authenticated roles
-   **Room sizes are insertable by admins**: Allows INSERT for authenticated users who are admins
-   **Room sizes are updatable by admins**: Allows UPDATE for authenticated users who are admins
-   **Room sizes are deletable by admins**: Allows DELETE for authenticated users who are admins

## Functions

### check_schema_permissions()

Returns JSON with current user's permissions on the schema, tables, and functions.

### get_current_role()

Returns JSON with information about the current user, role, and JWT claims. Now extracts user information directly from JWT token.

### handle_commission_total()

Trigger function that sets commission_total to null if the user is an admin or manager. Now gets user role directly from JWT claims.

### is_requesting_user_admin()

Returns boolean indicating if the requesting user has an admin role. Checks the user's role in the JWT token's public_metadata.

### is_requesting_user_manager()

Returns boolean indicating if the requesting user has a manager role. Checks the user's role in the JWT token's public_metadata.

### requesting_user_id()

Returns the user ID (clerk_id) from the JWT sub claim.

### requesting_user_role()

Returns the user role from the JWT token's public_metadata.

### update_updated_at_column()

Trigger function that updates the updated_at column to the current timestamp.

### verify_jwt()

Test function for JWT verification.

## Triggers

| Table              | Trigger Name             | Timing | Event  | Function                   |
| ------------------ | ------------------------ | ------ | ------ | -------------------------- |
| accommodation_room | set_updated_at_timestamp | BEFORE | UPDATE | update_updated_at_column() |
| accommodation_type | set_updated_at_timestamp | BEFORE | UPDATE | update_updated_at_column() |
| campus             | set_updated_at_timestamp | BEFORE | UPDATE | update_updated_at_column() |
| course_detail      | set_updated_at_timestamp | BEFORE | UPDATE | update_updated_at_column() |
| course_price       | set_updated_at_timestamp | BEFORE | UPDATE | update_updated_at_column() |
| rules              | set_updated_at_timestamp | BEFORE | UPDATE | update_updated_at_column() |
| quotes             | set_commission_total     | BEFORE | INSERT | handle_commission_total()  |
| quotes             | set_commission_total     | BEFORE | UPDATE | handle_commission_total()  |
| quotes             | set_updated_at_timestamp | BEFORE | UPDATE | update_updated_at_column() |
| region             | set_updated_at_timestamp | BEFORE | UPDATE | update_updated_at_column() |
| room_size          | set_updated_at_timestamp | BEFORE | UPDATE | update_updated_at_column() |

## Indexes

### accommodation_room

-   **accommodation_room_pkey**: UNIQUE INDEX on (accommodation_type_id, room_size_id)

### accommodation_type

-   **accommodation_type_pkey**: UNIQUE INDEX on (id)
-   **accommodation_type_name_key**: UNIQUE INDEX on (name)
-   **idx_accommodation_type_name**: INDEX on (name)

### campus

-   **campus_pkey**: UNIQUE INDEX on (id)
-   **campus_campus_name_key**: UNIQUE INDEX on (campus_name)
-   **idx_campus_name**: INDEX on (campus_name)

### course_campus

-   **course_campus_pkey**: UNIQUE INDEX on (course_id, campus_id)

### course_detail

-   **course_detail_pkey**: UNIQUE INDEX on (id)
-   **course_detail_course_identifier_key**: UNIQUE INDEX on (course_identifier)
-   **idx_course_name**: INDEX on (course_name)
-   **idx_course_identifier**: INDEX on (course_identifier)
-   **idx_course_faculty**: INDEX on (faculty_id)
-   **idx_course_type**: INDEX on (course_type)

### course_price

-   **course_price_pkey**: UNIQUE INDEX on (id)
-   **idx_course_price_course**: INDEX on (course_details_id)
-   **idx_course_price_region**: INDEX on (region_id)
-   **idx_course_price_dates**: INDEX on (price_start_date, price_end_date)

### rules

-   **rules_pkey**: UNIQUE INDEX on (id)
-   **idx_rules_region**: INDEX on (region_id)
-   **idx_rules_dates**: INDEX on (start_date, end_date)
-   **idx_rules_conditions**: GIN INDEX on (conditions)

### quotes

-   **quotes_pkey**: UNIQUE INDEX on (id)
-   **idx_quotes_user**: INDEX on (clerk_id)
-   **idx_quotes_created_at**: INDEX on (created_at)
-   **idx_quotes_commission**: INDEX on (commission_total)
-   **idx_quotes_input**: GIN INDEX on (quote_input)
-   **idx_quotes_output**: GIN INDEX on (quote_output)

### region

-   **region_pkey**: UNIQUE INDEX on (id)
-   **region_region_name_key**: UNIQUE INDEX on (region_name)
-   **idx_region_name**: INDEX on (region_name)

### room_size

-   **room_size_pkey**: UNIQUE INDEX on (id)
-   **room_size_name_key**: UNIQUE INDEX on (name)
-   **idx_room_size_name**: INDEX on (name)

## PostgreSQL Extensions

The database uses several PostgreSQL extensions to enhance functionality:

| Extension Name     | Version | Description                                               |
| ------------------ | ------- | --------------------------------------------------------- |
| pg_graphql         | 1.5.9   | GraphQL support                                           |
| pg_stat_statements | 1.10    | Track planning and execution statistics of SQL statements |
| pgcrypto           | 1.3     | Cryptographic functions                                   |
| pgjwt              | 0.2.0   | JSON Web Token API for PostgreSQL                         |
| pgsodium           | 3.1.8   | Modern cryptography library for PostgreSQL                |
| plpgsql            | 1.0     | PL/pgSQL procedural language                              |
| supabase_vault     | 0.2.8   | Supabase Vault Extension for secure storage               |
| uuid-ossp          | 1.1     | Generate universally unique identifiers (UUIDs)           |

## Check Constraints

The database implements various check constraints to ensure data integrity:

### region

-   **valid_countries**: Ensures the countries array has at least one element
    ```sql
    ((array_length(countries, 1) > 0))
    ```

### quotes

-   **valid_commission**: Ensures commission_total is either NULL or non-negative
    ```sql
    (((commission_total IS NULL) OR (commission_total >= (0)::numeric)))
    ```
-   **valid_quote_input**: Ensures quote_input is a valid JSON object with required fields
    ```sql
    (((jsonb_typeof(quote_input) = 'object'::text) AND (quote_input ? 'student_details'::text) AND (quote_input ? 'course_details'::text)))
    ```
-   **valid_quote_output**: Ensures quote_output is a valid JSON object with required fields
    ```sql
    (((jsonb_typeof(quote_output) = 'object'::text) AND (quote_output ? 'total_price'::text) AND (quote_output ? 'breakdown'::text)))
    ```

### course_detail

-   **valid_duration_weeks**: Ensures proper duration_weeks based on duration_type
    ```sql
    ((((duration_type = 'fixed'::duration_type) AND (duration_weeks IS NOT NULL) AND (array_length(duration_weeks, 1) > 0)) OR ((duration_type = 'weekly'::duration_type) AND (duration_weeks IS NULL))))
    ```
-   **valid_class_options**: Ensures at least one class option is offered
    ```sql
    ((full_time_offered OR part_time_offered OR night_classes_offered OR day_classes_offered))
    ```
-   **valid_intake_dates**: Ensures intake_dates array has at least one element
    ```sql
    ((array_length(intake_dates, 1) > 0))
    ```

### course_price

-   **valid_price**: Ensures either base_price or price_per_week is provided, but not both
    ```sql
    ((((base_price IS NOT NULL) AND (price_per_week IS NULL)) OR ((base_price IS NULL) AND (price_per_week IS NOT NULL))))
    ```
-   **valid_date_range**: Ensures end dates are after start dates
    ```sql
    (((price_end_date IS NULL) OR (price_end_date > price_start_date)))
    ```

### accommodation_room

-   **accommodation_room_price_per_week_check**: Ensures price_per_week is positive
    ```sql
    ((price_per_week > (0)::numeric))
    ```

### rules

-   **valid_date_range**: Ensures end dates are after start dates
-   **valid_value**: Ensures values are appropriate for the rule type
    ```sql
    ((((value_type = 'fixed'::value_type) AND (value <> (0)::numeric)) OR ((value_type = 'percentage'::value_type) AND ((value >= ('-100'::integer)::numeric) AND (value <= (100)::numeric)))))
    ```
-   **valid_conditions**: Ensures conditions is a valid JSON object
    ```sql
    ((jsonb_typeof(conditions) = 'object'::text))
    ```

## Usage Examples

This section provides examples of common database operations using the Supabase JavaScript client.

### Authentication and User Management

```javascript
// Example of how to integrate Clerk with Supabase
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/clerk-react";

// Create a Supabase client with the Clerk token
export function createClerkSupabaseClient() {
    const { getToken } = useAuth();

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: async () => {
                    const token = await getToken({ template: "supabase" });
                    return {
                        Authorization: `Bearer ${token}`,
                    };
                },
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        }
    );

    return supabase;
}
```

### Creating a Quote

```javascript
// Create a new quote
const createQuote = async (quoteInput) => {
    const { getToken } = useAuth();
    const clerkToken = await getToken({ template: "supabase" });

    // Calculate the quote output
    const quoteOutput = await calculateQuote(quoteInput, clerkToken);

    // Get user ID from Clerk
    const user = useUser();
    const clerkId = user.id;

    const { data, error } = await supabase.from("quotes").insert({
        clerk_id: clerkId,
        quote_input: quoteInput,
        quote_output: quoteOutput,
        // commission_total will be set by the trigger for non-admin users
    });

    if (error) throw error;
    return data;
};
```

### Applying Pricing Rules

```javascript
// Get applicable pricing rules for a specific region and date
const getPricingRules = async (regionId, applyDate) => {
    const { data, error } = await supabase
        .from("rules")
        .select("*")
        .eq("region_id", regionId)
        .lte("start_date", applyDate)
        .or(`end_date.is.null,end_date.gte.${applyDate}`);

    if (error) throw error;
    return data;
};
```

### Working with Accommodation Options

```javascript
// Get all accommodation types with their room sizes and prices
const getAccommodationOptions = async () => {
    const { data, error } = await supabase.from("accommodation_type").select(`
          *,
          accommodation_room (
            price_per_week,
            room_size:room_size_id (*)
          )
        `);

    if (error) throw error;
    return data;
};
```

## Performance Considerations

This section outlines important performance considerations for working with the database.

### High-Volume Tables

The following tables are expected to grow large over time and have specific optimizations:

1. **quotes** - This table will grow continuously as users generate quotes. It uses:

    - GIN indexes on JSONB columns (`quote_input` and `quote_output`) to optimize JSON queries
    - Regular indexes on `clerk_id`, `created_at`, and `commission_total` for common filtering operations
    - Consider implementing archiving strategies for quotes older than a certain period

2. **course_price** - May contain many price variations over time:
    - Indexed on date ranges to optimize queries for current prices
    - Queries should always include date filters to avoid scanning historical prices

### Query Optimisation

For optimal performance:

1. **Always filter by indexed columns** - Particularly important for:

    - Filtering quotes by clerk_id
    - Filtering rules by date ranges
    - Filtering courses by faculty_id or course_type

2. **Use appropriate JSONB operators** - When querying JSONB fields:

    - Use `?` operator for key existence checks
    - Use `->` and `->>` operators for accessing specific keys
    - Use `@>` operator with GIN indexes for containment queries

3. **Limit deep nested queries** - When fetching related data:
    - Limit the depth of nested relationships in a single query
    - For complex data needs, consider multiple targeted queries instead of one large query

## Data Lifecycle Management

This section describes strategies for managing data throughout its lifecycle.

### Data Retention

1. **Quotes**:

    - Consider implementing a data retention policy for quotes
    - Options include:
        - Archiving quotes older than 12 months to a separate table
        - Aggregating historical quote data for reporting while removing individual records

2. **Rules**:
    - Historical rules and prices are maintained with start/end dates
    - Expired rules and prices remain in the database for historical reference
    - Queries should filter by date to retrieve only active records

### Backup and Recovery

The Supabase database is automatically backed up according to the service plan:

1. **Point-in-time recovery** - Available for restoring the database to any point within the retention period
2. **Scheduled backups** - Configured according to the Supabase service plan

### Data Validation

Beyond database constraints, implement application-level validation:

1. **Input validation** - Validate all user inputs before inserting into the database
2. **Business rule validation** - Implement business rules in the application layer
3. **Data consistency checks** - Periodically run consistency checks to identify and fix data anomalies

## Data Transformation

This section explains how form data is transformed before being stored in the database, particularly focusing on the JSONB structure of the `quotes` table.

### Form Field to Database Field Mapping

The application collects data through form fields that are then transformed and stored in the database. Here are the key transformations:

#### JSONB Structure in `quotes.quote_input`

The `quote_input` JSONB column must contain the following structure to satisfy database constraints:

```json
{
    "student_details": {
        // Student information
    },
    "course_details": [
        // Array of course selections
    ]
}
```

Form fields are mapped to this structure as follows:

| Form Field              | JSONB Path                                          | Transformation                                                  |
| ----------------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| `studentFirstName`      | `student_details.firstName`                         | Direct mapping                                                  |
| `studentLastName`       | `student_details.lastName`                          | Direct mapping                                                  |
| `studentEmail`          | `student_details.email`                             | Direct mapping                                                  |
| `studentNationality`    | `student_details.nationality`                       | Direct mapping, also used to look up `region_id`                |
| `studentAddress`        | `student_details.address`                           | Direct mapping                                                  |
| `hasStudentVisa`        | `student_details.hasStudentVisa`                    | Direct mapping                                                  |
| `isOffshore`            | `student_details.isOffshore` and `onshore_offshore` | Boolean to string: `true` → `"offshore"`, `false` → `"onshore"` |
| `isPreviousStudent`     | `student_details.isPreviousStudent`                 | Direct mapping                                                  |
| Course form fields      | `course_details[i].*`                               | Each course entry becomes an object in the array                |
| `accommodationType`     | `accommodation.type`                                | Direct mapping                                                  |
| `accommodationRoomSize` | `accommodation.roomSize`                            | Direct mapping                                                  |
| `needsTransport`        | `accommodation.needsTransport`                      | Direct mapping                                                  |

#### JSONB Structure in `quotes.quote_output`

The `quote_output` JSONB column must contain:

```json
{
  "total_price": number,
  "breakdown": [
    {
      "label": string,
      "amount": number
    }
    // Additional breakdown items
  ]
}
```

This structure is generated by the quote calculation logic based on the input data and applicable rules.

### Boolean to String Conversions

Several boolean form fields are converted to string values for rule evaluation:

| Form Field (Boolean) | Database Field (String) | Conversion                                   |
| -------------------- | ----------------------- | -------------------------------------------- |
| `isOffshore`         | `onshore_offshore`      | `true` → `"offshore"`, `false` → `"onshore"` |
| `studyLoad`          | `study_load`            | `"full_time"` or `"part_time"` (direct)      |
| `timetable`          | `day_night_classes`     | `"day"` or `"night"` (direct)                |

### ID Lookups

Several form fields require database lookups to obtain the corresponding IDs:

| Form Field              | Database Lookup                                                |
| ----------------------- | -------------------------------------------------------------- |
| `studentNationality`    | Look up `region_id` from `region.countries` array              |
| `facultyName`           | Look up `faculty_id` from `faculties.faculty_name`             |
| `courseName`            | Look up `course_id` from `course_detail.course_name`           |
| `campusName`            | Look up `campus_id` from `campus.campus_name`                  |
| `accommodationType`     | Look up `accommodation_type_id` from `accommodation_type.name` |
| `accommodationRoomSize` | Look up `room_size_id` from `room_size.name`                   |

These transformations ensure that the data collected through the user interface is properly structured and validated before being stored in the database.

## Clerk Integration & Authentication

This section provides a comprehensive overview of the Clerk integration for authentication and user management in the Pricing Tool application.

### Authentication Flow

The application uses Clerk for authentication and user management, with Supabase for database access. All user information is stored in Clerk, with no separate users table in Supabase. The authentication flow works as follows:

1. Users sign up or log in through Clerk's authentication UI
2. Clerk issues a JWT token with the "supabase" template
3. The client uses this token to authenticate with Supabase
4. User data including role and organisation_id is stored in Clerk's public metadata
5. Role-based access control is implemented using Supabase Row Level Security (RLS) policies that check JWT claims

### User Profile Structure

User profiles are stored in Clerk with the following public metadata structure:

```json
{
  "role": "admin" | "manager" | "agent",
  "organisation_id": "uuid-string",
  // Additional user metadata as needed
}
```

### JWT Token Structure

The JWT tokens issued by Clerk with the "supabase" template contain the following important claims:

```json
{
  "sub": "clerk-user-id",
  "public_metadata": {
    "role": "admin" | "manager" | "agent",
    "organisation_id": "uuid-string"
  }
}
```

These claims are used by Supabase RLS policies and database functions to:

-   Identify users via the `sub` claim
-   Determine permissions via the `public_metadata.role` claim
-   Associate data with organisations via the `public_metadata.organisation_id` claim

### Client-Side Integration

The application uses a custom Supabase client that injects the Clerk JWT token into requests:

```javascript
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/clerk-react";

export function createClerkSupabaseClient() {
    const { getToken } = useAuth();

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: async () => {
                const token = await getToken({ template: "supabase" });
                return {
                    Authorization: `Bearer ${token}`,
                };
            },
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}
```

### Role Management

The application implements role-based access control using a React context provider:

```jsx
export function RoleProvider({ children }) {
    const { user } = useUser();
    const role = user?.publicMetadata?.role || "agent";

    // Provide role information and capabilities to components
    return (
        <RoleContext.Provider
            value={{
                role,
                isAdmin: role === "admin",
                isManager: role === "manager",
            }}
        >
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    return useContext(RoleContext);
}
```

## Edge Functions

The application uses several Supabase Edge Functions to handle server-side operations. Below are the key edge functions:

### invitations

**Purpose**: Manages user invitations using Clerk's invitation API.

**Endpoints**:

-   `POST /invitations/send` - Sends invitations to new users
-   `POST /invitations/revoke` - Revokes a pending invitation
-   `GET /invitations/pending` - Gets all pending invitations

**Key Features**:

-   Verifies requesting user has admin or manager role
-   Validates email addresses
-   Sets user role and organisation in Clerk's public metadata
-   Configures a redirect URL to the sign-up page
-   Handles errors and returns detailed responses

### manage-users

**Purpose**: Provides user management functionality working directly with Clerk's API.

**Endpoints**:

-   `POST /manage-users/delete` - Deletes a user from Clerk
-   `POST /manage-users/update` - Updates a user's metadata in Clerk
-   `GET /manage-users` - Fetches users from Clerk

**Key Features**:

-   Verifies requesting user has admin role
-   Manages user metadata in Clerk
-   Handles error scenarios with detailed responses
-   Provides consistent interface for user management

### calculate-quote

**Purpose**: Calculates quotes based on user inputs and pricing rules.

**Endpoint**: `POST /calculate-quote`

**Key Features**:

-   Securely accesses pricing data from Supabase
-   Applies pricing rules, fees, and discounts
-   Generates detailed breakdown of calculations
-   Returns formatted quote output

### Shared Modules

The edge functions use shared modules for common functionality:

#### auth.ts

-   `verifyUserRole`: Verifies user role based on JWT claims
-   `verifyWebhookSignature`: Verifies Clerk webhook signatures

#### clerk.ts

-   `verifyClerkSession`: Verifies if a Clerk session is valid
-   `sendClerkInvitation`: Sends invitations through Clerk's API

#### supabase.ts

-   `createSupabaseClient`: Creates a Supabase client for server-side operations
-   `getOrCreateOrganisation`: Gets or creates an organisation

#### types.ts

-   Defines TypeScript interfaces for various edge function operations

## Quote Generation Functions

This section outlines the functions needed for the quote generation flow in the Pricing Tool application. These functions will be implemented as Supabase Edge Functions to keep pricing logic secure and hidden from the client.

### Overview

The quote generation flow requires several JavaScript functions to evaluate rule conditions and calculate the final quote based on user inputs. By implementing these as Edge Functions, we ensure that sensitive pricing logic remains server-side while providing a simple API for the client application.

### Required Functions

#### evaluateRuleConditions

**Purpose**: Evaluates whether a set of conditions matches the provided quote data.

**Signature**:

```javascript
/**
 * Evaluates if a set of conditions matches the provided quote data
 * @param {Object} conditions - The conditions object from a rule
 * @param {Object} quoteData - The quote data to evaluate against
 * @returns {boolean} - Whether all conditions match
 */
function evaluateRuleConditions(conditions, quoteData) {
    // Implementation needed
}
```

**Implementation Details**:

-   Should support all operators defined in the `Rule Condition Operators Reference` (`rule-condition-operators-reference.md`) file
-   Must handle different data types (string, number, boolean, date)
-   Should implement compound logic (AND/OR)

**Example Implementation**:

```javascript
function evaluateRuleConditions(conditions, quoteData) {
    // For each field in conditions
    for (const [field, operators] of Object.entries(conditions)) {
        // Special handling for compound operators
        if (field === "OR" && Array.isArray(operators)) {
            const orResult = operators.some((condition) =>
                evaluateRuleConditions(condition, quoteData)
            );
            if (!orResult) return false;
            continue;
        }

        // Get the value from quoteData (handling nested paths)
        const value = getNestedValue(quoteData, field);

        // For each operator on this field
        for (const [operator, compareValue] of Object.entries(operators)) {
            if (!evaluateOperator(operator, value, compareValue)) {
                return false;
            }
        }
    }

    return true;
}
```

#### calculateFinalQuote

**Purpose**: Calculates the final quote by applying pricing rules, fees, and discounts.

**Signature**:

```javascript
/**
 * Calculates the final quote by applying pricing rules, fees, and discounts
 * @param {Object} quoteInput - The user input data
 * @param {Array} pricingRules - The pricing rules from the database
 * @param {Array} feeRules - The fee rules from the database
 * @param {Array} discountRules - The discount rules from the database
 * @returns {Object} - The final quote with breakdown
 */
function calculateFinalQuote(
    quoteInput,
    pricingRules,
    feeRules,
    discountRules
) {
    // Implementation needed
}
```

**Implementation Details**:

-   Should apply pricing rules first to determine base prices
-   Then apply fee rules to add additional fees
-   Finally apply discount rules to reduce the total
-   Must maintain a detailed breakdown of all calculations
-   Should handle multiple courses and accommodation options

### Edge Function Implementation

The quote calculation will be implemented as a Supabase Edge Function named `calculate-quote` with the following characteristics:

1. **Endpoint**: `POST /calculate-quote`

2. **Request Body**:

```json
{
    "quoteInput": {
        // Quote input structure as defined below
    }
}
```

3. **Response**:

```json
{
    "quoteOutput": {
        // Quote output structure as defined below
    }
}
```

4. **Security**:
    - Uses Supabase service role to access database
    - Validates input data before processing
    - Implements proper error handling and logging

### Implementation Guidelines

1. **Performance**: The functions should be optimised for performance, especially when handling complex conditions and large datasets.

2. **Error Handling**: Implement robust error handling to deal with invalid inputs, missing data, or unexpected conditions.

3. **Testability**: Write the functions in a way that makes them easy to test, with clear inputs and outputs.

4. **Maintainability**: Use clear variable names, add comments, and structure the code for easy maintenance.

5. **Extensibility**: Design the functions to be easily extended with new operators or rule types in the future.

### Data Structures

#### Quote Input

The quote input should follow this structure:

```javascript
{
  student_details: {
    firstName: string,
    lastName: string,
    dateOfBirth: string, // ISO date format
    email: string,
    phone: string,
    nationality: string,
    isOffshore: boolean,
    isStudentVisa: boolean
  },
  course_details: [
    {
      course_id: number,
      campus_id: number,
      intake_date: string, // ISO date format
      duration_weeks: number,
      course_type: string // "VET" or "ENGLISH"
    }
  ],
  accommodation: {
    accommodation_type_id: number,
    room_size_id: number,
    check_in_date: string, // ISO date format
    duration_weeks: number
  }
}
```

#### Quote Output

The quote output should follow this structure:

```javascript
{
  total_price: number,
  breakdown: {
    courses: [
      {
        course_id: number,
        base_price: number,
        adjusted_price: number,
        adjustments: [
          {
            rule_id: number,
            rule_name: string,
            amount: number,
            type: string // "fixed" or "percent"
          }
        ]
      }
    ],
    accommodation: {
      accommodation_type_id: number,
      room_size_id: number,
      base_price: number,
      adjusted_price: number,
      adjustments: [
        {
          rule_id: number,
          rule_name: string,
          amount: number,
          type: string // "fixed" or "percent"
        }
      ]
    },
    fees: [
      {
        rule_id: number,
        rule_name: string,
        amount: number,
        type: string // "fixed" or "percent"
      }
    ],
    discounts: [
      {
        rule_id: number,
        rule_name: string,
        amount: number,
        type: string // "fixed" or "percent"
      }
    ]
  }
}
```

### Client Integration

The client application will integrate with the quote calculation edge function as follows:

```javascript
// Example client-side code to call the edge function
async function generateQuote(quoteInput) {
    try {
        const { data, error } = await supabase.functions.invoke(
            "calculate-quote",
            {
                body: { quoteInput },
            }
        );

        if (error) throw error;

        return data.quoteOutput;
    } catch (error) {
        console.error("Error generating quote:", error);
        throw error;
    }
}
```
