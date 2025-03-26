import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    formatAUDate,
    parseAUDate,
    formatAUDateRange,
    parseAUDateRange,
    getDefaultDateRange,
    isDateInPast,
    addDaysToDate,
    isValidDate,
} from "@/lib/utils/date";

/**
 * @typedef {Object} DateRangePickerProps
 * @property {string} [label="Date Range"]
 * @property {Date} [startDate]
 * @property {Date} [endDate]
 * @property {(date: Date | null) => void} onStartDateChange
 * @property {(date: Date | null) => void} onEndDateChange
 * @property {boolean} [allowEndDate=true]
 * @property {boolean} [defaultHasEndDate=false]
 * @property {number} [defaultEndDateDays=30]
 * @property {string} [checkboxLabel="Set an end date"]
 * @property {string} [className=""]
 * @property {string} [error]
 * @property {(error: string) => void} [onError]
 * @property {number} [numberOfMonths=3]
 * @property {boolean} [disablePastDates=true]
 * @property {boolean} [disabled=false]
 */

/**
 * A flexible date picker component that supports both single date and date range selection.
 * Allows both manual input and calendar-based selection with various configuration options.
 * Supports AU date format (DD/MM/YYYY).
 *
 * @example
 * // Minimal usage with required props
 * ```jsx
 * <DateRangePicker
 *   onStartDateChange={(date) => setStartDate(date)}
 *   onEndDateChange={(date) => setEndDate(date)}
 * />
 * ```
 *
 * @example
 * // Full usage with all available props
 * ```jsx
 * <DateRangePicker
 *   label="Course Duration"
 *   startDate={new Date()}
 *   endDate={new Date()}
 *   onStartDateChange={(date) => setStartDate(date)}
 *   onEndDateChange={(date) => setEndDate(date)}
 *   allowEndDate={true}
 *   defaultHasEndDate={true}
 *   defaultEndDateDays={60}
 *   checkboxLabel="Add end date"
 *   className="w-full"
 *   error="Please select valid dates"
 *   onError={(error) => handleError(error)}
 *   numberOfMonths={2}
 *   disablePastDates={false}
 *   disabled={false}
 * />
 * ```
 *
 * @param {DateRangePickerProps} props
 * @returns {JSX.Element}
 */

export function DateRangePicker({
    /** Label displayed above the date picker */
    label = "Date Range",
    /** Initial start date */
    startDate,
    /** Initial end date (only used when hasEndDate is true) */
    endDate,
    /** Callback fired when start date changes */
    onStartDateChange,
    /** Callback fired when end date changes */
    onEndDateChange,
    /** Whether to allow end date selection */
    allowEndDate = true,
    /** Whether to start with end date enabled */
    defaultHasEndDate = false,
    /** Number of days to add to start date when enabling end date */
    defaultEndDateDays = 30,
    /** Label for the end date checkbox */
    checkboxLabel = "Set an end date",
    /** Additional CSS classes */
    className = "",
    /** Error message to display */
    error,
    /** Callback fired when error state changes */
    onError,
    /** Number of months to display in calendar (default: 3) */
    numberOfMonths = 3,
    /** Whether to disable past dates (default: true) */
    disablePastDates = true,
    /** Whether the entire date picker is disabled */
    disabled = false,
}) {
    const [hasEndDate, setHasEndDate] = useState(defaultHasEndDate);
    const [dateRange, setDateRange] = useState(() => ({
        from: startDate || new Date(),
        to: hasEndDate
            ? endDate ||
              addDaysToDate(startDate || new Date(), defaultEndDateDays)
            : undefined,
    }));
    const [dateInput, setDateInput] = useState("");
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const inputRef = useRef(null);
    const [dateError, setDateError] = useState(error || "");

    useEffect(() => {
        const today = new Date();
        const formattedDate = formatAUDate(today);
        setDateInput(formattedDate);
        setDateRange({
            from: today,
            to: hasEndDate
                ? addDaysToDate(today, defaultEndDateDays)
                : undefined,
        });
        onStartDateChange(today);
        onEndDateChange(
            hasEndDate ? addDaysToDate(today, defaultEndDateDays) : null
        );
    }, []);

    const handleDateInput = (e) => {
        const value = e.target.value;

        if (!/^[\d\s/-]*$/.test(value)) {
            return;
        }

        setDateInput(value);
        setDateError("");
        if (onError) onError("");

        try {
            // Check if we're entering or removing a range separator
            const isEnteringRange = value.includes("-");
            if (isEnteringRange !== hasEndDate && allowEndDate) {
                setHasEndDate(isEnteringRange);
            }

            if (isEnteringRange && allowEndDate) {
                const { from: startDate, to: endDate } =
                    parseAUDateRange(value);

                if (startDate) {
                    if (endDate) {
                        // Complete range
                        setDateRange({ from: startDate, to: endDate });
                        onStartDateChange(startDate);
                        onEndDateChange(endDate);
                    } else {
                        // Partial range - only start date
                        setDateRange({ from: startDate, to: undefined });
                        onStartDateChange(startDate);
                        onEndDateChange(null);
                    }
                }
            } else {
                // Single date mode
                const date = parseAUDate(value);
                if (date) {
                    setDateRange({ from: date, to: undefined });
                    onStartDateChange(date);
                    onEndDateChange(null);
                }
            }
        } catch (e) {
            // Ignore parsing errors while typing
        }
    };

    const handleDateInputBlur = () => {
        try {
            // If we have no input text, reset to today
            if (!dateInput || !dateInput.trim()) {
                const today = new Date();
                setHasEndDate(false);
                setDateRange({
                    from: today,
                    to: undefined,
                });
                setDateInput(formatAUDate(today));
                onStartDateChange(today);
                onEndDateChange(null);
                setDateError("");
                if (onError) onError("");
                return;
            }

            if (hasEndDate && allowEndDate) {
                const { from: startDate, to: endDate } =
                    parseAUDateRange(dateInput);

                if (!startDate) {
                    throw new Error("Invalid start date");
                }

                // If we have a start date but no end date in range mode,
                // or if start and end dates are the same,
                // switch to single mode with the start date
                if (
                    !endDate ||
                    (endDate && startDate.getTime() === endDate.getTime())
                ) {
                    setHasEndDate(false);
                    setDateRange({ from: startDate, to: undefined });
                    setDateInput(formatAUDate(startDate));
                    onStartDateChange(startDate);
                    onEndDateChange(null);
                    setDateError("");
                    if (onError) onError("");
                    return;
                }

                if (endDate < startDate) {
                    throw new Error("End date must be after start date");
                }

                // Valid range - update with complete dates
                setDateRange({ from: startDate, to: endDate });
                setDateInput(
                    formatAUDateRange({ from: startDate, to: endDate })
                );
                onStartDateChange(startDate);
                onEndDateChange(endDate);
                setDateError("");
                if (onError) onError("");
            } else {
                // Single date mode
                const parsedDate = parseAUDate(dateInput);
                if (!parsedDate) {
                    throw new Error("Invalid date format");
                }
                setDateRange({ from: parsedDate, to: undefined });
                setDateInput(formatAUDate(parsedDate));
                onStartDateChange(parsedDate);
                onEndDateChange(null);
                setDateError("");
                if (onError) onError("");
            }
        } catch (e) {
            const errorMessage = hasEndDate
                ? "Please enter valid dates in format DD/MM/YYYY - DD/MM/YYYY"
                : "Please enter a valid date in format DD/MM/YYYY";
            setDateError(errorMessage);
            if (onError) onError(errorMessage);
        }
    };

    return (
        <div className={className}>
            {label && (
                <Label className="text-foreground text-sm font-medium">
                    {label}
                </Label>
            )}
            <div className="grid gap-2 h-full">
                <Popover
                    open={isPopoverOpen}
                    onOpenChange={(open) => {
                        if (disabled) return;
                        setIsPopoverOpen(open);
                        // When closing the popover, handle it like a blur event
                        if (!open) {
                            handleDateInputBlur();
                        }
                    }}
                    className="w-full h-full"
                >
                    <PopoverTrigger asChild>
                        <div className="relative w-full h-full">
                            <Input
                                ref={inputRef}
                                value={dateInput}
                                onChange={handleDateInput}
                                onBlur={(e) => {
                                    // Only handle blur if we're not interacting with the calendar
                                    if (!isPopoverOpen) {
                                        handleDateInputBlur();
                                    }
                                }}
                                onFocus={() => {
                                    if (disabled) return;
                                    setDateError("");
                                    if (onError) onError("");
                                    setIsPopoverOpen(true);
                                }}
                                onClick={(e) => {
                                    if (disabled) return;
                                    e.stopPropagation();
                                    setIsPopoverOpen(true);
                                }}
                                className="pl-10 h-full"
                                placeholder={
                                    hasEndDate
                                        ? "Select or type a date range"
                                        : "Select or type a date"
                                }
                                disabled={disabled}
                            />
                            <CalendarIcon
                                className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${
                                    disabled ? "opacity-50" : "cursor-pointer"
                                }`}
                                onClick={(e) => {
                                    if (disabled) return;
                                    e.stopPropagation();
                                    setIsPopoverOpen(true);
                                    inputRef.current?.focus();
                                }}
                            />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto"
                        onOpenAutoFocus={(e) => {
                            e.preventDefault();
                        }}
                        onInteractOutside={(e) => {
                            if (inputRef.current?.contains(e.target)) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <Calendar
                            mode={hasEndDate ? "range" : "single"}
                            selected={hasEndDate ? dateRange : dateRange.from}
                            numberOfMonths={numberOfMonths}
                            onSelect={(value) => {
                                if (!value) return;

                                if (hasEndDate) {
                                    const { from, to } = value;

                                    // If clicking the start date of an existing range, clear the selection
                                    if (
                                        from &&
                                        dateRange.from &&
                                        dateRange.to &&
                                        from.getTime() ===
                                            dateRange.from.getTime() &&
                                        to &&
                                        from.getTime() === to.getTime()
                                    ) {
                                        setDateRange({
                                            from: undefined,
                                            to: undefined,
                                        });
                                        setDateInput("");
                                        onStartDateChange(null);
                                        onEndDateChange(null);
                                        return;
                                    }

                                    if (from) {
                                        if (to) {
                                            // Both dates are valid
                                            setDateRange({ from, to });
                                            setDateInput(
                                                formatAUDateRange({ from, to })
                                            );
                                            onStartDateChange(from);
                                            onEndDateChange(to);
                                        } else {
                                            // Only start date is valid
                                            setDateRange({
                                                from,
                                                to: undefined,
                                            });
                                            setDateInput(formatAUDate(from));
                                            onStartDateChange(from);
                                            onEndDateChange(null);
                                        }
                                    }
                                } else {
                                    // Single date mode
                                    setDateRange({
                                        from: value,
                                        to: undefined,
                                    });
                                    setDateInput(formatAUDate(value));
                                    onStartDateChange(value);
                                    onEndDateChange(null);
                                }
                            }}
                            disabled={
                                disablePastDates ? isDateInPast : undefined
                            }
                        />
                    </PopoverContent>
                </Popover>
                {dateError && <div className="text-red-500">{dateError}</div>}
            </div>
            {allowEndDate && (
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="hasEndDate"
                        checked={hasEndDate}
                        disabled={disabled}
                        onCheckedChange={(checked) => {
                            setHasEndDate(checked);

                            // Get the current start date from dateRange
                            const currentStartDate = dateRange.from;

                            if (checked) {
                                // Only proceed if we have a valid start date
                                if (
                                    currentStartDate &&
                                    isValidDate(currentStartDate)
                                ) {
                                    // Adding end date - set to defaultEndDateDays from current start date
                                    const endDate = addDaysToDate(
                                        currentStartDate,
                                        defaultEndDateDays
                                    );

                                    // Update states
                                    setDateRange({
                                        from: currentStartDate,
                                        to: endDate,
                                    });
                                    setDateInput(
                                        formatAUDateRange({
                                            from: currentStartDate,
                                            to: endDate,
                                        })
                                    );
                                    onStartDateChange(currentStartDate);
                                    onEndDateChange(endDate);
                                }
                            } else {
                                // Removing end date - keep only start date
                                if (
                                    currentStartDate &&
                                    isValidDate(currentStartDate)
                                ) {
                                    setDateRange({
                                        from: currentStartDate,
                                        to: undefined,
                                    });
                                    setDateInput(
                                        formatAUDate(currentStartDate)
                                    );
                                    onStartDateChange(currentStartDate);
                                    onEndDateChange(null);
                                }
                            }
                        }}
                    />
                    <Label
                        htmlFor="hasEndDate"
                        className={`text-sm text-muted-foreground ${
                            disabled ? "opacity-50" : ""
                        }`}
                    >
                        {checkboxLabel}
                    </Label>
                </div>
            )}
        </div>
    );
}

DateRangePicker.propTypes = {
    /** Label displayed above the date picker */
    label: PropTypes.string,
    /** Initial start date */
    startDate: PropTypes.instanceOf(Date),
    /** Initial end date (only used when hasEndDate is true) */
    endDate: PropTypes.instanceOf(Date),
    /** Callback fired when start date changes */
    onStartDateChange: PropTypes.func.isRequired,
    /** Callback fired when end date changes */
    onEndDateChange: PropTypes.func.isRequired,
    /** Whether to allow end date selection */
    allowEndDate: PropTypes.bool,
    /** Whether to start with end date enabled */
    defaultHasEndDate: PropTypes.bool,
    /** Number of days to add to start date when enabling end date */
    defaultEndDateDays: PropTypes.number,
    /** Label for the end date checkbox */
    checkboxLabel: PropTypes.string,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Error message to display */
    error: PropTypes.string,
    /** Callback fired when error state changes */
    onError: PropTypes.func,
    /** Number of months to display in calendar (default: 3) */
    numberOfMonths: PropTypes.number,
    /** Whether to disable past dates (default: true) */
    disablePastDates: PropTypes.bool,
    /** Whether the entire date picker is disabled */
    disabled: PropTypes.bool,
};
