import { z } from "zod";

export const emailSchema = z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address");

export const nameSchema = z
    .string()
    .min(2, "Must be at least 2 characters")
    .max(50, "Must be less than 50 characters")
    .regex(
        /^[a-zA-Z\s-']+$/,
        "Must contain only letters, spaces, hyphens, and apostrophes"
    );

/**
 * Helper function to create a required field schema with custom message
 */
export function required(schema, message = "This field is required") {
    return schema.min(1, message);
}

/**
 * Helper function to create an optional field schema
 */
export function optional(schema) {
    return schema.optional().nullable();
}
