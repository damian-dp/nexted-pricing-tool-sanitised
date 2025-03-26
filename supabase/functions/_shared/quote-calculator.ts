/**
 * Utility functions for calculating quotes based on pricing rules, fees, and discounts.
 */
// @ts-ignore
import { evaluateRuleConditions } from "./rule-evaluator.ts";

// Define types for the quote calculation
export interface QuoteInput {
    student_details: {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        email: string;
        phone?: string;
        nationality: string;
        isOffshore: boolean;
        isStudentVisa: boolean;
    };
    course_details: Array<{
        course_id: string;
        campus_id: string;
        intake_date: string;
        duration_weeks: number;
        course_type: string;
    }>;
    accommodation?: {
        accommodation_type_id: string;
        room_size_id: string;
        check_in_date: string;
        duration_weeks: number;
    };
}

export interface PricingRule {
    id: string;
    rule_description: string;
    applies_to: string;
    type: string;
    value: number;
    conditions: Record<string, any>;
}

export interface FeeRule {
    id: string;
    fee_name: string;
    fee_description: string;
    applies_to: string;
    type: string;
    value: number;
    conditions: Record<string, any>;
}

export interface DiscountRule {
    id: string;
    discount_name: string;
    discount_description: string;
    applies_to: string;
    type: string;
    value: number;
    conditions: Record<string, any>;
}

export interface CoursePrice {
    id: string;
    course_details_id: string;
    region_id: string;
    base_price: number | null;
    price_per_week: number | null;
}

export interface AccommodationRoom {
    accommodation_type_id: string;
    room_size_id: string;
    price_per_week: number;
}

export interface QuoteOutput {
    total_price: number;
    breakdown: {
        courses: Array<{
            course_id: string;
            base_price: number;
            adjusted_price: number;
            adjustments: Array<{
                rule_id: string;
                rule_name: string;
                amount: number;
                type: string;
            }>;
        }>;
        accommodation?: {
            accommodation_type_id: string;
            room_size_id: string;
            base_price: number;
            adjusted_price: number;
            adjustments: Array<{
                rule_id: string;
                rule_name: string;
                amount: number;
                type: string;
            }>;
        };
        fees: Array<{
            rule_id: string;
            rule_name: string;
            amount: number;
            type: string;
        }>;
        discounts: Array<{
            rule_id: string;
            rule_name: string;
            amount: number;
            type: string;
        }>;
    };
}

/**
 * Calculates the base price for a course
 * @param course The course details from the quote input
 * @param coursePrice The course price from the database
 * @returns The base price for the course
 */
export function calculateCourseBasePrice(
    course: QuoteInput["course_details"][0],
    coursePrice: CoursePrice
): number {
    // If there's a fixed base price, use that
    if (coursePrice.base_price !== null) {
        return coursePrice.base_price;
    }

    // Otherwise, calculate based on price per week
    if (coursePrice.price_per_week !== null) {
        return coursePrice.price_per_week * course.duration_weeks;
    }

    // If neither is available, return 0
    return 0;
}

/**
 * Applies pricing rules to a course
 * @param course The course details from the quote input
 * @param basePrice The base price for the course
 * @param pricingRules The pricing rules from the database
 * @param quoteData The full quote data for condition evaluation
 * @returns The adjusted price and adjustments
 */
export function applyCourseRules(
    course: QuoteInput["course_details"][0],
    basePrice: number,
    pricingRules: PricingRule[],
    quoteData: Record<string, any>
): {
    adjustedPrice: number;
    adjustments: QuoteOutput["breakdown"]["courses"][0]["adjustments"];
} {
    let adjustedPrice = basePrice;
    const adjustments: QuoteOutput["breakdown"]["courses"][0]["adjustments"] =
        [];

    // Filter rules that apply to course_price
    const applicableRules = pricingRules.filter(
        (rule) =>
            rule.applies_to === "course_price" &&
            evaluateRuleConditions(rule.conditions, quoteData)
    );

    // Apply each rule
    for (const rule of applicableRules) {
        let adjustmentAmount = 0;

        if (rule.type === "fixed") {
            adjustmentAmount = rule.value;
            adjustedPrice += rule.value;
        } else if (rule.type === "percent") {
            adjustmentAmount = (basePrice * rule.value) / 100;
            adjustedPrice += adjustmentAmount;
        }

        adjustments.push({
            rule_id: rule.id,
            rule_name: rule.rule_description,
            amount: adjustmentAmount,
            type: rule.type,
        });
    }

    return { adjustedPrice, adjustments };
}

/**
 * Applies pricing rules to accommodation
 * @param accommodation The accommodation details from the quote input
 * @param basePrice The base price for the accommodation
 * @param pricingRules The pricing rules from the database
 * @param quoteData The full quote data for condition evaluation
 * @returns The adjusted price and adjustments
 */
export function applyAccommodationRules(
    accommodation: NonNullable<QuoteInput["accommodation"]>,
    basePrice: number,
    pricingRules: PricingRule[],
    quoteData: Record<string, any>
): {
    adjustedPrice: number;
    adjustments: NonNullable<
        QuoteOutput["breakdown"]["accommodation"]
    >["adjustments"];
} {
    let adjustedPrice = basePrice;
    const adjustments: NonNullable<
        QuoteOutput["breakdown"]["accommodation"]
    >["adjustments"] = [];

    // Filter rules that apply to accommodation
    const applicableRules = pricingRules.filter(
        (rule) =>
            rule.applies_to === "accommodation" &&
            evaluateRuleConditions(rule.conditions, quoteData)
    );

    // Apply each rule
    for (const rule of applicableRules) {
        let adjustmentAmount = 0;

        if (rule.type === "fixed") {
            adjustmentAmount = rule.value;
            adjustedPrice += rule.value;
        } else if (rule.type === "percent") {
            adjustmentAmount = (basePrice * rule.value) / 100;
            adjustedPrice += adjustmentAmount;
        }

        adjustments.push({
            rule_id: rule.id,
            rule_name: rule.rule_description,
            amount: adjustmentAmount,
            type: rule.type,
        });
    }

    return { adjustedPrice, adjustments };
}

/**
 * Applies fee rules to the quote
 * @param quoteData The full quote data for condition evaluation
 * @param feeRules The fee rules from the database
 * @param totalBeforeFees The total price before fees
 * @returns The fees to apply
 */
export function applyFeeRules(
    quoteData: Record<string, any>,
    feeRules: FeeRule[],
    totalBeforeFees: number
): QuoteOutput["breakdown"]["fees"] {
    const fees: QuoteOutput["breakdown"]["fees"] = [];

    // Apply each fee rule
    for (const rule of feeRules) {
        // Check if the rule conditions match
        if (evaluateRuleConditions(rule.conditions, quoteData)) {
            let feeAmount = 0;

            if (rule.type === "fixed") {
                feeAmount = rule.value;
            } else if (rule.type === "percent") {
                feeAmount = (totalBeforeFees * rule.value) / 100;
            }

            fees.push({
                rule_id: rule.id,
                rule_name: rule.fee_name,
                amount: feeAmount,
                type: rule.type,
            });
        }
    }

    return fees;
}

/**
 * Applies discount rules to the quote
 * @param quoteData The full quote data for condition evaluation
 * @param discountRules The discount rules from the database
 * @param totalBeforeDiscounts The total price before discounts
 * @returns The discounts to apply
 */
export function applyDiscountRules(
    quoteData: Record<string, any>,
    discountRules: DiscountRule[],
    totalBeforeDiscounts: number
): QuoteOutput["breakdown"]["discounts"] {
    const discounts: QuoteOutput["breakdown"]["discounts"] = [];

    // Apply each discount rule
    for (const rule of discountRules) {
        // Check if the rule conditions match
        if (evaluateRuleConditions(rule.conditions, quoteData)) {
            let discountAmount = 0;

            if (rule.type === "fixed") {
                discountAmount = rule.value;
            } else if (rule.type === "percent") {
                discountAmount = (totalBeforeDiscounts * rule.value) / 100;
            }

            discounts.push({
                rule_id: rule.id,
                rule_name: rule.discount_name,
                amount: discountAmount,
                type: rule.type,
            });
        }
    }

    return discounts;
}

/**
 * Calculates the final quote by applying pricing rules, fees, and discounts
 * @param quoteInput The user input data
 * @param pricingRules The pricing rules from the database
 * @param feeRules The fee rules from the database
 * @param discountRules The discount rules from the database
 * @param coursePrices The course prices from the database
 * @param accommodationRooms The accommodation room prices from the database
 * @returns The final quote with breakdown
 */
export function calculateFinalQuote(
    quoteInput: QuoteInput,
    pricingRules: PricingRule[],
    feeRules: FeeRule[],
    discountRules: DiscountRule[],
    coursePrices: CoursePrice[],
    accommodationRooms: AccommodationRoom[]
): QuoteOutput {
    // Prepare the quote output structure
    const quoteOutput: QuoteOutput = {
        total_price: 0,
        breakdown: {
            courses: [],
            fees: [],
            discounts: [],
        },
    };

    // Convert the input to a flat object for condition evaluation
    const quoteData = {
        ...quoteInput,
        // Add derived fields that might be used in conditions
        onshore_offshore: quoteInput.student_details.isOffshore
            ? "offshore"
            : "onshore",
    };

    // Calculate course prices
    let coursesTotal = 0;

    for (const course of quoteInput.course_details) {
        // Find the course price
        const coursePrice = coursePrices.find(
            (cp) => cp.course_details_id === course.course_id
        );

        if (!coursePrice) {
            console.warn(`No price found for course ${course.course_id}`);
            continue;
        }

        // Calculate base price
        const basePrice = calculateCourseBasePrice(course, coursePrice);

        // Apply pricing rules
        const { adjustedPrice, adjustments } = applyCourseRules(
            course,
            basePrice,
            pricingRules,
            quoteData
        );

        // Add to the breakdown
        quoteOutput.breakdown.courses.push({
            course_id: course.course_id,
            base_price: basePrice,
            adjusted_price: adjustedPrice,
            adjustments,
        });

        coursesTotal += adjustedPrice;
    }

    // Calculate accommodation price if provided
    let accommodationTotal = 0;

    if (quoteInput.accommodation) {
        // Find the accommodation room price
        const accommodationRoom = accommodationRooms.find(
            (ar) =>
                ar.accommodation_type_id ===
                    quoteInput.accommodation?.accommodation_type_id &&
                ar.room_size_id === quoteInput.accommodation?.room_size_id
        );

        if (accommodationRoom) {
            // Calculate base price
            const basePrice =
                accommodationRoom.price_per_week *
                quoteInput.accommodation.duration_weeks;

            // Apply pricing rules
            const { adjustedPrice, adjustments } = applyAccommodationRules(
                quoteInput.accommodation,
                basePrice,
                pricingRules,
                quoteData
            );

            // Add to the breakdown
            quoteOutput.breakdown.accommodation = {
                accommodation_type_id:
                    quoteInput.accommodation.accommodation_type_id,
                room_size_id: quoteInput.accommodation.room_size_id,
                base_price: basePrice,
                adjusted_price: adjustedPrice,
                adjustments,
            };

            accommodationTotal = adjustedPrice;
        }
    }

    // Calculate subtotal before fees and discounts
    const subtotal = coursesTotal + accommodationTotal;

    // Apply fee rules
    const fees = applyFeeRules(quoteData, feeRules, subtotal);
    quoteOutput.breakdown.fees = fees;

    // Calculate total with fees
    const totalWithFees =
        subtotal + fees.reduce((sum, fee) => sum + fee.amount, 0);

    // Apply discount rules
    const discounts = applyDiscountRules(
        quoteData,
        discountRules,
        totalWithFees
    );
    quoteOutput.breakdown.discounts = discounts;

    // Calculate final total
    quoteOutput.total_price =
        totalWithFees -
        discounts.reduce((sum, discount) => sum + discount.amount, 0);

    return quoteOutput;
}
