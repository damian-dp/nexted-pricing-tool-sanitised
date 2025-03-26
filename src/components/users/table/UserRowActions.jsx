import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    RiMoreLine,
    RiUserSettingsLine,
    RiDeleteBinLine,
} from "@remixicon/react";
import { useRole } from "@/providers/RoleProvider";
import { useSharedUsersManagement } from "@/providers/UsersManagementProvider";

export function UserRowActions({
    item,
    onRefresh,
    onEditUser,
    onManageOrganisations,
}) {
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get role directly from RoleProvider
    const { role: currentUserRole, isAdmin, capabilities } = useRole();

    // Use our consolidated useUserManagement hook for user operations
    const { deleteUser, revokeInvitation } = useSharedUsersManagement();

    // Correctly determine if this is an invitation or a user
    const isPendingInvite = Boolean(item && item.type === "invitation");

    // Handle delete for users and invitations
    const handleDelete = useCallback(async () => {
        try {
            setIsDeleting(true);
            console.log(
                `Deleting ${isPendingInvite ? "invitation" : "user"} with ID:`,
                item.id
            );

            if (isPendingInvite) {
                // Delete invitation using the revokeInvitation function
                await revokeInvitation(item.id, item.role);
                console.log("Invitation revoked successfully");
            } else {
                // Delete user using our consolidated hook
                await deleteUser(item.clerk_id, item.role);
                console.log("User deleted successfully");
            }

            setShowDeleteConfirmation(false);

            // Refresh the data
            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error("Error deleting:", error);
            // You might want to show an error toast here
        } finally {
            setIsDeleting(false);
        }
    }, [item, onRefresh, isPendingInvite, deleteUser, revokeInvitation]);

    return (
        <div className="flex justify-end">
            {/* Confirmation Dialog for Deletion */}
            <AlertDialog
                open={showDeleteConfirmation}
                onOpenChange={setShowDeleteConfirmation}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isPendingInvite
                                ? "Delete Invitation?"
                                : "Delete User?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this{" "}
                            {isPendingInvite ? "invitation" : "user"}? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                    >
                        <RiMoreLine className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuGroup>
                        {/* Only show Edit User option for users, not for invitations */}
                        {!isPendingInvite && (
                            <DropdownMenuItem onClick={() => onEditUser(item)}>
                                <RiUserSettingsLine className="mr-2 h-4 w-4" />
                                Edit User
                            </DropdownMenuItem>
                        )}

                        {/* For invitations: can delete if they can invite that role */}
                        {/* For users: use standard delete capabilities */}
                        {((isPendingInvite &&
                            ((item.role === "admin" &&
                                capabilities?.canInviteAdmins) ||
                                (item.role === "manager" &&
                                    capabilities?.canInviteManagers) ||
                                (item.role === "agent" &&
                                    capabilities?.canInviteAgents))) ||
                            (!isPendingInvite &&
                                ((item.role === "admin" &&
                                    capabilities?.canDeleteAdmins) ||
                                    (item.role === "manager" &&
                                        capabilities?.canDeleteManagers) ||
                                    (item.role === "agent" &&
                                        capabilities?.canDeleteAgents)))) && (
                            <DropdownMenuItem
                                onClick={() => setShowDeleteConfirmation(true)}
                                className="text-destructive focus:text-destructive"
                                disabled={isDeleting}
                            >
                                <RiDeleteBinLine className="mr-2 h-4 w-4" />
                                {isPendingInvite
                                    ? "Delete Invitation"
                                    : "Delete User"}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

UserRowActions.propTypes = {
    item: PropTypes.object.isRequired,
    onRefresh: PropTypes.func.isRequired,
    onEditUser: PropTypes.func.isRequired,
    onManageOrganisations: PropTypes.func.isRequired,
};
