import React, { useRef } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils/styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    RiCloseCircleLine,
    RiDeleteBinLine,
    RiFilter3Line,
    RiSearch2Line,
    RiErrorWarningLine,
} from "@remixicon/react";
import {
    APPLIES_TO_LABELS,
    RULE_STATUS,
    RULE_STATUS_LABELS,
} from "@/constants/enums";

export function RuleTableFilters({
    table,
    uniqueRuleTypes,
    selectedRuleTypes,
    onRuleTypeFilterChange,
    selectedValidityStatus,
    onValidityStatusFilterChange,
    onBulkDelete,
    id,
}) {
    const inputRef = useRef(null);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left side */}
            <div className="flex items-center gap-3">
                {/* Filter by name */}
                <div className="relative">
                    <Input
                        id={`${id}-input`}
                        ref={inputRef}
                        className={cn(
                            "peer min-w-60 ps-9 bg-background bg-gradient-to-br from-accent/60 to-accent",
                            Boolean(
                                table.getColumn("name")?.getFilterValue()
                            ) && "pe-9"
                        )}
                        value={table.getColumn("name")?.getFilterValue() ?? ""}
                        onChange={(e) =>
                            table
                                .getColumn("name")
                                ?.setFilterValue(e.target.value)
                        }
                        placeholder="Search by rule name"
                        type="text"
                        aria-label="Search by rule name"
                    />
                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/60 peer-disabled:opacity-50">
                        <RiSearch2Line size={20} aria-hidden="true" />
                    </div>
                    {Boolean(table.getColumn("name")?.getFilterValue()) && (
                        <button
                            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/60 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Clear filter"
                            onClick={() => {
                                table.getColumn("name")?.setFilterValue("");
                                if (inputRef.current) {
                                    inputRef.current.focus();
                                }
                            }}
                        >
                            <RiCloseCircleLine size={16} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Delete button */}
                {table.getSelectedRowModel().rows.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="ml-auto" variant="outline">
                                <RiDeleteBinLine
                                    className="-ms-1 opacity-60"
                                    size={16}
                                    aria-hidden="true"
                                />
                                Delete
                                <span className="-me-1 ms-1 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                                    {table.getSelectedRowModel().rows.length}
                                </span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                                <div
                                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                                    aria-hidden="true"
                                >
                                    <RiErrorWarningLine
                                        className="opacity-80"
                                        size={16}
                                    />
                                </div>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete{" "}
                                        {
                                            table.getSelectedRowModel().rows
                                                .length
                                        }{" "}
                                        selected{" "}
                                        {table.getSelectedRowModel().rows
                                            .length === 1
                                            ? "rule"
                                            : "rules"}
                                        .
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onBulkDelete}>
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                {/* Filters */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline">
                            <RiFilter3Line
                                className="size-5 -ms-1.5 text-muted-foreground/60"
                                size={20}
                                aria-hidden="true"
                            />
                            Filter
                            {(selectedRuleTypes.length > 0 ||
                                selectedValidityStatus.length > 0) && (
                                <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                                    {selectedRuleTypes.length +
                                        selectedValidityStatus.length}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto min-w-72 p-4" align="end">
                        <div className="space-y-4">
                            {/* Rule Type Filters */}
                            <div className="space-y-3">
                                <div className="text-xs font-medium uppercase text-muted-foreground/60">
                                    Rule Type
                                </div>
                                <div className="space-y-3">
                                    {uniqueRuleTypes.map((type, i) => (
                                        <div
                                            key={type}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id={`${id}-type-${i}`}
                                                checked={selectedRuleTypes.includes(
                                                    type
                                                )}
                                                onCheckedChange={(checked) =>
                                                    onRuleTypeFilterChange(
                                                        type,
                                                        checked
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor={`${id}-type-${i}`}
                                                className="flex grow justify-between gap-2 font-normal"
                                            >
                                                {APPLIES_TO_LABELS[type] ||
                                                    type}{" "}
                                                <span className="ms-2 text-xs text-muted-foreground">
                                                    {table
                                                        .getColumn("appliesTo")
                                                        ?.getFacetedUniqueValues()
                                                        ?.get(type)}
                                                </span>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Validity Status Filters */}
                            <div className="space-y-3">
                                <div className="text-xs font-medium uppercase text-muted-foreground/60">
                                    Status
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(RULE_STATUS_LABELS).map(
                                        ([status, label], i) => (
                                            <div
                                                key={status}
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox
                                                    id={`${id}-status-${i}`}
                                                    checked={selectedValidityStatus.includes(
                                                        status
                                                    )}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        onValidityStatusFilterChange(
                                                            status,
                                                            checked
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`${id}-status-${i}`}
                                                    className="flex grow justify-between gap-2 font-normal"
                                                >
                                                    {label}{" "}
                                                    <span className="ms-2 text-xs text-muted-foreground">
                                                        {table
                                                            .getColumn("status")
                                                            ?.getFacetedUniqueValues()
                                                            ?.get(status)}
                                                    </span>
                                                </Label>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}

RuleTableFilters.propTypes = {
    table: PropTypes.object.isRequired,
    uniqueRuleTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectedRuleTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
    onRuleTypeFilterChange: PropTypes.func.isRequired,
    selectedValidityStatus: PropTypes.arrayOf(PropTypes.string).isRequired,
    onValidityStatusFilterChange: PropTypes.func.isRequired,
    onBulkDelete: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired,
};
