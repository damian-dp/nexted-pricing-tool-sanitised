import { useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/users/users-table";
import { InviteUserDialog } from "@/components/users/dialogs/InviteUserDialog";
import { EditUserDialog } from "@/components/users/dialogs/EditUserDialog";
import { ManageOrganisationsDialog } from "@/components/users/dialogs/ManageOrganisationsDialog";
import { PlusIcon, RefreshCw } from "lucide-react";
import { useSharedUsersManagement } from "@/providers/UsersManagementProvider";

export default function UsersPage() {
    const { user } = useUser();
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [orgDialogOpen, setOrgDialogOpen] = useState(false);
    const [orgDialogCallback, setOrgDialogCallback] = useState(null);

    // Use hook to get utility functions and share state
    const { refreshData, isLoading } = useSharedUsersManagement();

    const handleOpenInviteDialog = useCallback(() => {
        setInviteDialogOpen(true);
    }, []);

    const handleOpenEditDialog = useCallback((user) => {
        setEditingUser(user);
        setEditUserDialogOpen(true);
    }, []);

    const handleOpenOrgDialog = useCallback((callback) => {
        setOrgDialogCallback(() => callback);
        setOrgDialogOpen(true);
    }, []);

    const handleOrgDialogOpenChange = useCallback((isOpen) => {
        if (!isOpen) {
            setOrgDialogOpen(false);
            setOrgDialogCallback(null);
        }
    }, []);

    if (!user) {
        return (
            <div className="container mx-auto py-8 text-center">
                Loading user information...
            </div>
        );
    }

    return (
        <>
            <div className="container mx-auto py-8 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <div className="flex gap-2">
                        <Button onClick={handleOpenInviteDialog}>
                            <PlusIcon className="h-4 w-4" />
                            Invite User
                        </Button>
                        <Button
                            onClick={refreshData}
                            variant="outline"
                            size="icon"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                <UsersTable
                    onEditUser={handleOpenEditDialog}
                    onManageOrganisations={handleOpenOrgDialog}
                />
            </div>

            <InviteUserDialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                onManageOrganisations={handleOpenOrgDialog}
            />

            <EditUserDialog
                user={editingUser}
                open={editUserDialogOpen}
                onOpenChange={setEditUserDialogOpen}
                refreshUsers={refreshData}
                onManageOrganisations={handleOpenOrgDialog}
            />

            <ManageOrganisationsDialog
                open={orgDialogOpen}
                onOpenChange={handleOrgDialogOpenChange}
                onOrganisationAdded={(newOrg) => {
                    orgDialogCallback?.(newOrg);
                }}
            />
        </>
    );
}
