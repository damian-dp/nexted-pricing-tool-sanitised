import React, {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils/styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@/components/ui/pagination";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Separator } from "@/components/ui/separator";
import {
    RiArrowDownSLine,
    RiArrowUpSLine,
    RiCloseCircleLine,
    RiDeleteBinLine,
    RiErrorWarningLine,
    RiFilter3Line,
    RiMoreLine,
    RiSearch2Line,
    RiUserAddLine,
    RiCheckLine,
    RiUserSettingsLine,
} from "@remixicon/react";
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontalIcon, RefreshCwIcon, Loader2 } from "lucide-react";
import { USER_ROLES, ROLE_LABELS, ROLE_HIERARCHY } from "@/constants";
import { useRole } from "@/providers/RoleProvider";
import { useAuth } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/lib/supabase";

// Import our extracted components and utilities
import { getUserTableColumns } from "@/components/users/table/UserTableColumns.jsx";
import { UserTableFilters } from "@/components/users/table/UserTableFilters";
import { UserTablePagination } from "@/components/users/table/UserTablePagination";
import { useUsersTable } from "@/hooks/useUsersTable";
import { UserRowActions } from "@/components/users/table/UserRowActions";

export function UsersTable({ onEditUser, onManageOrganisations }) {
    const [forceUpdate, setForceUpdate] = useState(0);
    const {
        data,
        isLoading,
        error,
        refreshData,
        hasData,
        showLoading,
        showError,
        showEmpty,
        organisationLookup,
        deleteUser,
        revokeInvitation,
    } = useUsersTable(forceUpdate);

    const id = useId();
    const { role: currentUserRole } = useRole();
    const { userId } = useAuth();

    // Table state
    const [columnFilters, setColumnFilters] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState({});
    const [rowSelection, setRowSelection] = useState({});
    const [sorting, setSorting] = useState([]);
    const [selectedRoleValues, setSelectedRoleValues] = useState([]);

    // Get unique role values for filtering
    const uniqueRoleValues = useMemo(() => {
        const uniqueRoles = new Set();
        data.forEach((user) => {
            if (user && user.role) {
                uniqueRoles.add(user.role);
            }
        });
        return Array.from(uniqueRoles).sort();
    }, [data]);

    // Get columns with memoization to prevent rerenders
    const columns = useMemo(() => {
        return getUserTableColumns({
            data,
            currentUserRole,
            userId,
            organisations: organisationLookup,
            refreshData,
            onEditUser,
            onManageOrganisations,
        });
    }, [
        currentUserRole,
        userId,
        organisationLookup,
        refreshData,
        data,
        onEditUser,
        onManageOrganisations,
    ]);

    // Initialize table
    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        meta: {
            refreshData,
        },
        autoResetAll: true,
    });

    // Debug logging for data changes
    useEffect(() => {
        console.log("UsersTable - Data changed:", {
            data,
            rowCount: table.getRowModel().rows.length,
            filteredCount: table.getFilteredRowModel().rows.length,
            pageCount: table.getPageCount(),
        });
    }, [data, table]);

    // Handle role filter change
    const handleRoleFilterChange = useCallback(
        (value, checked) => {
            const newFilterValue = [...selectedRoleValues];
            if (checked) {
                newFilterValue.push(value);
            } else {
                const index = newFilterValue.indexOf(value);
                if (index !== -1) {
                    newFilterValue.splice(index, 1);
                }
            }
            setSelectedRoleValues(newFilterValue);
            table.getColumn("role")?.setFilterValue(newFilterValue);
        },
        [selectedRoleValues, table]
    );

    // Reset pagination when data changes
    useEffect(() => {
        table.resetPagination();
    }, [data, table]);

    // Handle bulk delete
    const handleBulkDelete = useCallback(() => {
        const selectedRows = table.getSelectedRowModel().rows;
        if (selectedRows.length === 0) return;

        // Call refreshData after deletion
        Promise.all(
            selectedRows.map(async (row) => {
                const item = row.original;
                if (item.type === "invitation") {
                    await revokeInvitation(item.id, item.role);
                } else {
                    await deleteUser(item.clerk_id, item.role);
                }
            })
        )
            .then(() => {
                refreshData();
                table.resetRowSelection();
            })
            .catch((error) => {
                console.error("Error during bulk delete:", error);
            });
    }, [table, refreshData, deleteUser, revokeInvitation]);

    // Debug logging
    useEffect(() => {
        console.log("UsersTable - Data updated:", data);
    }, [data]);

    return (
        <div className="space-y-4">
            <UserTableFilters
                table={table}
                uniqueRoleValues={uniqueRoleValues}
                selectedRoles={selectedRoleValues}
                onRoleFilterChange={handleRoleFilterChange}
                onBulkDelete={handleBulkDelete}
                id={id}
            />

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody>
                    {showLoading ? (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                <div className="flex justify-center items-center">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="ml-2">Loading...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : showError ? (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                <div className="text-destructive">
                                    {error || "An error occurred"}
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : hasData ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                <div className="text-app-gray">
                                    No users found
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {hasData && <UserTablePagination table={table} />}
        </div>
    );
}

UsersTable.propTypes = {
    onEditUser: PropTypes.func.isRequired,
    onManageOrganisations: PropTypes.func.isRequired,
};
