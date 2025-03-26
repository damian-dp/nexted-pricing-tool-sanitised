import PropTypes from "prop-types";
import { useState, useMemo, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "lucide-react";
import { RuleTableFilters } from "./RuleTableFilters";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
} from "@tanstack/react-table";
import {
    RULE_VALUE_TYPES,
    APPLIES_TO_TYPES,
    APPLIES_TO_LABELS,
    RULE_STATUS,
    RULE_STATUS_LABELS,
} from "@/constants/enums";
import { formatDate } from "@/lib/utils/date";

/**
 * Table component for displaying and managing rules
 * Supports filtering by type, status, and name
 * Provides actions for editing and deleting rules
 */
export function RulesTable({ rules, onEdit, onDelete }) {
    // State for filters
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [nameFilter, setNameFilter] = useState("");

    const formatValue = useCallback((rule) => {
        const { value, valueType } = rule;
        if (valueType === RULE_VALUE_TYPES.PERCENT) {
            return `${value}%`;
        }
        return `$${value}`;
    }, []);

    // Calculate rule validity status
    const getRuleStatus = useCallback((rule) => {
        const now = new Date();
        const startDate = rule.startDate ? new Date(rule.startDate) : null;
        const endDate = rule.endDate ? new Date(rule.endDate) : null;

        if (!startDate) return RULE_STATUS.DRAFT;
        if (startDate > now) return RULE_STATUS.UPCOMING;
        if (endDate && endDate < now) return RULE_STATUS.EXPIRED;
        return RULE_STATUS.ACTIVE;
    }, []);

    // Memoize the processed table data
    const tableData = useMemo(() => {
        return rules.map((rule) => ({
            ...rule,
            status: getRuleStatus(rule),
            typeLabel: APPLIES_TO_LABELS[rule.appliesTo] || rule.appliesTo,
            statusLabel: RULE_STATUS_LABELS[getRuleStatus(rule)],
        }));
    }, [rules, getRuleStatus]);

    // Table columns definition
    const columns = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Name",
            },
            {
                accessorKey: "appliesTo",
                header: "Type",
                cell: ({ row }) => row.original.typeLabel,
            },
            {
                accessorKey: "description",
                header: "Description",
            },
            {
                accessorKey: "value",
                header: "Value",
                cell: ({ row }) => formatValue(row.original),
            },
            {
                accessorKey: "startDate",
                header: "Valid From",
                cell: ({ row }) => formatDate(row.original.startDate) || "—",
            },
            {
                accessorKey: "endDate",
                header: "Valid Until",
                cell: ({ row }) => formatDate(row.original.endDate) || "—",
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => row.original.statusLabel,
            },
        ],
        [formatValue]
    );

    // Memoize column filters
    const columnFilters = useMemo(
        () => [
            { id: "name", value: nameFilter },
            { id: "appliesTo", value: selectedTypes },
            { id: "status", value: selectedStatus },
        ],
        [nameFilter, selectedTypes, selectedStatus]
    );

    // Table instance
    const table = useReactTable({
        data: tableData,
        columns,
        state: {
            columnFilters,
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    // Filter handlers
    const handleTypeChange = useCallback((type, checked) => {
        setSelectedTypes((prev) =>
            checked ? [...prev, type] : prev.filter((t) => t !== type)
        );
    }, []);

    const handleStatusChange = useCallback((status, checked) => {
        setSelectedStatus((prev) =>
            checked ? [...prev, status] : prev.filter((s) => s !== status)
        );
    }, []);

    const handleBulkDelete = useCallback(() => {
        const selectedRows = table.getSelectedRowModel().rows;
        const selectedIds = selectedRows.map((row) => row.original.id);
        onDelete(selectedIds);
    }, [table, onDelete]);

    // Get unique rule types for filters
    const uniqueRuleTypes = useMemo(() => {
        return Object.values(APPLIES_TO_TYPES);
    }, []);

    return (
        <div className="space-y-4">
            <RuleTableFilters
                table={table}
                uniqueRuleTypes={uniqueRuleTypes}
                selectedRuleTypes={selectedTypes}
                onRuleTypeFilterChange={handleTypeChange}
                selectedValidityStatus={selectedStatus}
                onValidityStatusFilterChange={handleStatusChange}
                onBulkDelete={handleBulkDelete}
                id="rules-table"
            />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Valid From</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {table.getFilteredRowModel().rows.map((row) => (
                        <TableRow key={row.original.id}>
                            <TableCell className="font-medium">
                                {row.original.name}
                            </TableCell>
                            <TableCell>{row.original.typeLabel}</TableCell>
                            <TableCell>
                                {row.original.description || "—"}
                            </TableCell>
                            <TableCell>{formatValue(row.original)}</TableCell>
                            <TableCell>
                                {formatDate(row.original.startDate) || "—"}
                            </TableCell>
                            <TableCell>
                                {formatDate(row.original.endDate) || "—"}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(row.original)}
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            onDelete(row.original.id)
                                        }
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}

                    {table.getFilteredRowModel().rows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center">
                                No rules found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

RulesTable.propTypes = {
    rules: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            description: PropTypes.string,
            appliesTo: PropTypes.oneOf(Object.values(APPLIES_TO_TYPES))
                .isRequired,
            value: PropTypes.number.isRequired,
            valueType: PropTypes.oneOf(Object.values(RULE_VALUE_TYPES))
                .isRequired,
            startDate: PropTypes.string,
            endDate: PropTypes.string,
        })
    ).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};
