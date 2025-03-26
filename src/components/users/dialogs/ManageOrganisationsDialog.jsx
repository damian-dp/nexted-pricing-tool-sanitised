import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircleIcon, Pencil, Trash2, PlusCircle } from "lucide-react";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useSharedUsersManagement } from "@/providers/UsersManagementProvider";

export function ManageOrganisationsDialog({
    open,
    onOpenChange,
    onOrganisationAdded,
}) {
    const [name, setName] = useState("");
    const [editingOrg, setEditingOrg] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [orgToDelete, setOrgToDelete] = useState(null);

    // Use our consolidated useUserManagement hook
    const {
        organisations,
        isLoading,
        error,
        addOrganisation,
        updateOrganisation,
        deleteOrganisation,
    } = useSharedUsersManagement();

    // Reset form state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setName("");
            setEditingOrg(null);
            setOrgToDelete(null);
            setShowDeleteConfirm(false);
        }
    }, [open]);

    // Handle dialog state changes
    const handleDialogChange = (isOpen) => {
        // Only close if explicitly requested by clicking outside or the close button
        // and not during any operation
        if (!isOpen && !isLoading) {
            onOpenChange(false);
        }
    };

    // Add a new organization
    const handleAddOrganisation = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            const newOrg = await addOrganisation(name);
            if (newOrg) {
                setName("");
                // Call onOrganisationAdded with the new org but don't close the dialog
                onOrganisationAdded?.(newOrg);
            }
        } catch (err) {
            console.error("Error adding organisation:", err);
        }
    };

    // Update an organization
    const handleUpdateOrganisation = async (e) => {
        e.preventDefault();
        if (!editingOrg || !name.trim()) return;

        try {
            const updatedOrg = await updateOrganisation(editingOrg.id, name);
            if (updatedOrg) {
                setEditingOrg(null);
                setName("");
            }
        } catch (err) {
            console.error("Error updating organisation:", err);
        }
    };

    // Delete an organization
    const handleDeleteClick = (org) => {
        setOrgToDelete(org);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!orgToDelete) return;

        try {
            await deleteOrganisation(orgToDelete.id);
            setShowDeleteConfirm(false);
            setOrgToDelete(null);
        } catch (err) {
            console.error("Error deleting organisation:", err);
        }
    };

    const handleCancel = () => {
        setEditingOrg(null);
        setName("");
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleDialogChange}>
                <DialogContent
                    className="sm:max-w-[600px]"
                    onPointerDownOutside={(e) => {
                        // Prevent closing during operations
                        if (isLoading) {
                            e.preventDefault();
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Manage Organisations</DialogTitle>
                        <DialogDescription>
                            Add, edit, or delete organisations for your users.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <form
                            onSubmit={
                                editingOrg
                                    ? handleUpdateOrganisation
                                    : handleAddOrganisation
                            }
                            className="space-y-4"
                        >
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label htmlFor="name">
                                        {editingOrg
                                            ? "Update Organisation Name"
                                            : "New Organisation Name"}
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="Enter organisation name"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button
                                        type="submit"
                                        disabled={!name.trim() || isLoading}
                                    >
                                        {isLoading ? (
                                            <LoaderCircleIcon className="animate-spin" />
                                        ) : editingOrg ? (
                                            "Update"
                                        ) : (
                                            <>
                                                <PlusCircle className="w-4 h-4 mr-2" />
                                                Add
                                            </>
                                        )}
                                    </Button>
                                    {editingOrg && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleCancel}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>

                        {error && (
                            <div className="text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <ScrollArea className="h-[300px] rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="w-[100px]">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={2}
                                                className="h-24 text-center"
                                            >
                                                <LoaderCircleIcon className="mx-auto animate-spin" />
                                            </TableCell>
                                        </TableRow>
                                    ) : organisations.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={2}
                                                className="h-24 text-center"
                                            >
                                                No organisations found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        organisations.map((org) => (
                                            <TableRow key={org.id}>
                                                <TableCell>
                                                    {org.name}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditingOrg(
                                                                    org
                                                                );
                                                                setName(
                                                                    org.name
                                                                );
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                handleDeleteClick(
                                                                    org
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmationDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete Organisation"
                description="Are you sure you want to delete this organisation? This action cannot be undone."
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}
