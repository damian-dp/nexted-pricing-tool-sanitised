import { format, parseISO, isValid, parse, addDays } from "date-fns";
import { enAU } from "date-fns/locale";

/**
 * Format a date string or Date object into a human-readable format
 * @param {string|Date} date - The date to format
 * @param {string} formatStr - The format string to use (defaults to "PPP")
 * @returns {string} The formatted date string or empty string if invalid
 */
export function formatDate(date, formatStr = "PPP") {
    if (!date) return "";

    try {
        const dateObj = typeof date === "string" ? parseISO(date) : date;
        return isValid(dateObj)
            ? format(dateObj, formatStr, { locale: enAU })
            : "";
    } catch (error) {
        console.error("Error formatting date:", error);
        return "";
    }
}

/**
 * Format a date for API requests (ISO string without timezone)
 * @param {Date} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatDateForAPI(date) {
    if (!date || !isValid(date)) return null;
    return format(date, "yyyy-MM-dd");
}

/**
 * Format a datetime for display in the UI
 * @param {string|Date} date - The date to format
 * @returns {string} The formatted datetime string
 */
export function formatDateTime(date) {
    return formatDate(date, "PPp"); // e.g., "29 Apr 2021, 1:30 PM"
}

/**
 * Format a date for table display (shorter format)
 * @param {string|Date} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatTableDate(date) {
    return formatDate(date, "PP"); // e.g., "29 Apr 2021"
}

/**
 * Format a date in Australian format (DD/MM/YYYY)
 * @param {Date} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatAUDate(date) {
    if (!date || !isValid(date)) return "";
    return format(date, "dd/MM/yyyy", { locale: enAU });
}

/**
 * Parse a date string in Australian format (DD/MM/YYYY)
 * Handles both complete dates (DD/MM/YYYY) and partial dates (DD/MM)
 * @param {string} dateStr - The date string to parse
 * @returns {Date|null} The parsed date or null if invalid
 */
export function parseAUDate(dateStr) {
    if (!dateStr) return null;

    // Handle complete dates (with year)
    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
        const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
        if (isValid(parsed)) {
            // Fix two-digit years
            const year = parsed.getFullYear();
            if (year < 100) {
                const century = year < 50 ? 2000 : 1900;
                parsed.setFullYear(century + year);
            }
            return parsed;
        }
        return null;
    }

    // Handle partial dates (day/month only)
    const partialMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (partialMatch) {
        const [_, dayStr, monthStr] = partialMatch;
        const day = parseInt(dayStr, 10);
        const month = parseInt(monthStr, 10) - 1; // 0-based months

        const today = new Date();
        const currentYear = today.getFullYear();

        // Create date with current year
        const assumedDate = new Date(currentYear, month, day);

        // If the date is in the past, assume next year
        if (assumedDate < today) {
            assumedDate.setFullYear(currentYear + 1);
        }

        return isValid(assumedDate) ? assumedDate : null;
    }

    return null;
}

/**
 * Format a date range in Australian format
 * @param {Object} range - The date range object
 * @param {Date} range.from - Start date
 * @param {Date} range.to - End date (optional)
 * @returns {string} Formatted date range string
 */
export function formatAUDateRange(range) {
    const { from, to } = range;
    if (!from) return "";
    if (!to) return formatAUDate(from);
    return `${formatAUDate(from)} - ${formatAUDate(to)}`;
}

/**
 * Parse a date range string in Australian format
 * @param {string} rangeStr - The date range string (e.g., "01/01/2024 - 31/01/2024")
 * @returns {Object} Object with from and to dates
 */
export function parseAUDateRange(rangeStr) {
    if (!rangeStr) return { from: null, to: null };

    const [startStr, endStr] = rangeStr.split("-").map((str) => str.trim());
    const from = parseAUDate(startStr);
    const to = endStr ? parseAUDate(endStr) : null;

    return { from, to };
}

/**
 * Get default date range (today to today + 30 days)
 * @returns {Object} Default date range
 */
export function getDefaultDateRange() {
    const today = new Date();
    return {
        from: today,
        to: addDays(today, 30),
    };
}

/**
 * Check if a date is in the past (ignoring time)
 * @param {Date} date - The date to check
 * @returns {boolean} True if date is in the past
 */
export function isDateInPast(date) {
    if (!date || !isValid(date)) return false;
    const today = new Date();
    return (
        date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    );
}

/**
 * Add days to a date
 * @param {Date} date - The date to add days to
 * @param {number} amount - The number of days to add
 * @returns {Date} The new date
 */
export function addDaysToDate(date, amount) {
    return addDays(date, amount);
}

/**
 * Check if a date is valid
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is valid
 */
export function isValidDate(date) {
    return isValid(date);
}
