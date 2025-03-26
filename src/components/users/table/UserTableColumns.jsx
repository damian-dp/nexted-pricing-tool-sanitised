import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RiArrowDownSLine, RiArrowUpSLine } from "@remixicon/react";
import { UserRowActions } from "@/components/users/table/UserRowActions";
import { ROLE_LABELS } from "@/constants";

// Filter function for role filtering
export const roleFilterFn = (row, columnId, filterValue) => {
    if (!filterValue || filterValue.length === 0) return true;
    const role = row.getValue(columnId);
    return filterValue.includes(role);
};

export const getUserTableColumns = ({
    data,
    currentUserRole,
    userId,
    organisations,
    refreshUsers,
    refreshInvitations,
    setForceUpdate,
    onEditUser,
    onManageOrganisations,
}) => [
    {
        id: "select",
        header: ({ table }) => (
            <div className="flex items-center">
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            </div>
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <div
                className="flex items-center gap-3"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                Name
                {column.getIsSorted() === "asc" ? (
                    <RiArrowUpSLine className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                    <RiArrowDownSLine className="ml-2 h-4 w-4" />
                ) : null}
            </div>
        ),
        cell: ({ row }) => {
            const name = row.getValue("name");
            const email = row.original.email;
            const isCurrentUser = row.original.id === userId;
            const isPendingInvite = row.original.type === "invitation";

            return (
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <span className="font-medium">
                            {isPendingInvite ? (
                                <span className="text-muted-foreground">
                                    Pending Invitation
                                </span>
                            ) : (
                                name
                            )}
                        </span>
                        {isCurrentUser && <Badge>You</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {email}
                    </span>
                </div>
            );
        },
        size: 250,
    },
    {
        accessorKey: "organisation",
        header: ({ column }) => (
            <div
                className="flex items-center"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                Organisation
                {column.getIsSorted() === "asc" ? (
                    <RiArrowUpSLine className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                    <RiArrowDownSLine className="ml-2 h-4 w-4" />
                ) : null}
            </div>
        ),
        cell: ({ row }) => {
            const org = row.getValue("organisation");
            return (
                <div className="font-medium">
                    {org === "None" || org === null || org === undefined ? (
                        <span className="text-muted-foreground italic">
                            None
                        </span>
                    ) : (
                        org
                    )}
                </div>
            );
        },
        size: 200,
    },
    {
        accessorKey: "role",
        header: ({ column }) => (
            <div
                className="flex items-center"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                Role
                {column.getIsSorted() === "asc" ? (
                    <RiArrowUpSLine className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                    <RiArrowDownSLine className="ml-2 h-4 w-4" />
                ) : null}
            </div>
        ),
        cell: ({ row }) => {
            const role = row.getValue("role");
            const label = ROLE_LABELS[role] || role;

            return <Badge variant="outline">{label}</Badge>;
        },
        filterFn: roleFilterFn,
        size: 100,
    },
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row, table }) => {
            // Access refresh function from table meta
            const onRefresh = () => {
                // Use the onRefresh function from the row meta if available
                if (table.options.meta?.refreshData) {
                    table.options.meta.refreshData();
                } else {
                    // Fallback to direct usage of props
                    const promises = [];

                    if (refreshUsers) {
                        promises.push(refreshUsers());
                    }
                    if (refreshInvitations) {
                        promises.push(refreshInvitations());
                    }

                    // Only call Promise.all if we have promises to wait for
                    if (promises.length > 0) {
                        Promise.all(promises)
                            .then(() => {
                                setForceUpdate((prev) => prev + 1);
                            })
                            .catch(() => {
                                // Still force an update - remove console.error
                                setForceUpdate((prev) => prev + 1);
                            });
                    }
                }
            };

            return (
                <UserRowActions
                    item={row.original}
                    onRefresh={onRefresh}
                    onEditUser={onEditUser}
                    onManageOrganisations={onManageOrganisations}
                />
            );
        },
        size: 60,
        enableHiding: false,
    },
];
