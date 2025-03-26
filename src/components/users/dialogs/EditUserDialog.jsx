import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import PropTypes from "prop-types";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useRole } from "@/providers/RoleProvider"; // Import useRole hook
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES, ROLE_LABELS } from "@/constants/roles";
import { EDGE_FUNCTIONS } from "@/constants/api";
import { LoaderIcon, ChevronDownIcon, Plus, RefreshCw } from "lucide-react";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { useSharedUsersManagement } from "@/providers/UsersManagementProvider";
import { getSupabaseClient } from "@/lib/supabase";
import OrganisationDropdown from "@/components/users/common/OrganisationDropdown";
import { ROLE_CAPABILITIES } from "@/constants/roles";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const EditUserDialog = memo(
    ({ user, open, onOpenChange, refreshUsers, onManageOrganisations }) => {
        const { toast } = useToast();
        const { user: currentUser } = useUser();
        const { getToken } = useAuth();
        const { role: currentUserRole } = useRole(); // Get role from RoleProvider
        const {
            register,
            handleSubmit,
            reset,
            getValues,
            setValue,
            formState: { errors },
        } = useForm();
        const [error, setError] = useState(null);
        const [showConfirmation, setShowConfirmation] = useState(false);
        const [selectedRole, setSelectedRole] = useState("");
        const [selectedOrganisation, setSelectedOrganisation] = useState("");
        const [localOrganisations, setLocalOrganisations] = useState({
            count: 0,
            orgs: [],
        });

        // Use our consolidated useUsersManagement hook for all user operations
        const {
            updateUser,
            isUpdating,
            organisations: rawOrganisations,
            refreshData,
            error: updateError,
            deleteUser,
        } = useSharedUsersManagement();

        // Combined loading state
        const loading = isUpdating;

        // Memoize initial form data
        const initialFormData = useMemo(
            () => ({
                first_name: user?.firstName || "",
                last_name: user?.lastName || "",
                role: user?.role || "agent",
                organisation_id: user?.organisation_id || "",
            }),
            [user]
        );

        // Local state
        const [formData, setFormData] = useState(initialFormData);
        const [isSubmitting, setIsSubmitting] = useState(false);

        const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);

        // Initialize form when dialog opens
        useEffect(() => {
            if (open) {
                setFormData(initialFormData);
                setError(null);
            }
        }, [open, initialFormData]);

        // Update local organisations when rawOrganisations changes
        useEffect(() => {
            if (
                Array.isArray(rawOrganisations) &&
                rawOrganisations.length > 0
            ) {
                setLocalOrganisations({
                    count: rawOrganisations.length,
                    orgs: rawOrganisations,
                });
            }
        }, [rawOrganisations]);

        // Check if current user can view this user's profile
        const canViewProfile = useMemo(() => {
            if (!currentUser || !user) return false;

            const effectiveRole =
                currentUser.publicMetadata?.role || currentUserRole;
            const capabilities = ROLE_CAPABILITIES[effectiveRole];
            const targetUserRole = user.role;
            const isSelf = user.clerk_id === currentUser.id;

            // Can always view own profile
            if (isSelf) return true;

            // Check role-specific viewing permissions
            switch (targetUserRole) {
                case USER_ROLES.ADMIN:
                    return capabilities.canViewAdminProfiles;
                case USER_ROLES.MANAGER:
                    return capabilities.canViewManagerProfiles;
                case USER_ROLES.AGENT:
                    return capabilities.canViewAgentProfiles;
                default:
                    return false;
            }
        }, [currentUser, user, currentUserRole]);

        // Check if current user can modify this user's profile
        const canModifyProfile = useMemo(() => {
            if (!currentUser || !user) return false;

            const effectiveRole =
                currentUser.publicMetadata?.role || currentUserRole;
            const capabilities = ROLE_CAPABILITIES[effectiveRole];
            const targetUserRole = user.role;
            const isSelf = user.clerk_id === currentUser.id;

            // Can always edit own profile (except role and email)
            if (isSelf) return true;

            // Check role-specific modification permissions
            switch (targetUserRole) {
                case USER_ROLES.ADMIN:
                    return capabilities.canModifyAdminProfiles;
                case USER_ROLES.MANAGER:
                    return capabilities.canModifyManagerProfiles;
                case USER_ROLES.AGENT:
                    return capabilities.canModifyAgentProfiles;
                default:
                    return false;
            }
        }, [currentUser, user, currentUserRole]);

        // Check if current user can modify this user's role
        const canModifyRole = useMemo(() => {
            if (!currentUser || !user) return false;

            const effectiveRole =
                currentUser.publicMetadata?.role || currentUserRole;
            const capabilities = ROLE_CAPABILITIES[effectiveRole];
            const targetUserRole = user.role;
            const isSelf = user.clerk_id === currentUser.id;

            // Special case for modifying own role
            if (isSelf) {
                return capabilities.canModifyOwnRole;
            }

            // Check role-specific modification permissions
            switch (targetUserRole) {
                case USER_ROLES.ADMIN:
                    return capabilities.canModifyAdminRoles;
                case USER_ROLES.MANAGER:
                    return capabilities.canModifyManagerRoles;
                case USER_ROLES.AGENT:
                    return capabilities.canModifyAgentRoles;
                default:
                    return false;
            }
        }, [currentUser, user, currentUserRole]);

        // Check if current user can delete this user
        const canDeleteUser = useMemo(() => {
            if (!currentUser || !user) return false;

            const effectiveRole =
                currentUser.publicMetadata?.role || currentUserRole;
            const capabilities = ROLE_CAPABILITIES[effectiveRole];
            const targetUserRole = user.role;
            const isSelf = user.clerk_id === currentUser.id;

            // Cannot delete self
            if (isSelf) return false;

            // Check role-specific deletion permissions
            switch (targetUserRole) {
                case USER_ROLES.ADMIN:
                    return capabilities.canDeleteAdmins;
                case USER_ROLES.MANAGER:
                    return capabilities.canDeleteManagers;
                case USER_ROLES.AGENT:
                    return capabilities.canDeleteAgents;
                default:
                    return false;
            }
        }, [currentUser, user, currentUserRole]);

        // Update form when user data changes
        useEffect(() => {
            if (user) {
                const nameParts = (user.name || "").split(" ");
                const role = user.role || "AGENT";
                const organisation = user.organisation_id || "";

                reset({
                    firstName: nameParts[0] || "",
                    lastName: nameParts.slice(1).join(" ") || "",
                    role: role,
                    organisation: organisation,
                });

                setValue("role", role);
                setValue("organisation", organisation);
                setSelectedRole(role);
                setSelectedOrganisation(organisation);
            }
        }, [user, reset, setValue]);

        // Memoize form handlers
        const handleInputChange = useCallback((field, value) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
            setError(null);
        }, []);

        // Get available roles based on current user's role
        const availableRoles = useMemo(() => {
            const effectiveRole =
                currentUser?.publicMetadata?.role || currentUserRole;
            const capabilities = ROLE_CAPABILITIES[effectiveRole];
            const roles = [];

            // Add roles based on capabilities
            if (capabilities.canModifyAdminRoles) roles.push(USER_ROLES.ADMIN);
            if (capabilities.canModifyManagerRoles)
                roles.push(USER_ROLES.MANAGER);
            if (capabilities.canModifyAgentRoles) roles.push(USER_ROLES.AGENT);

            return roles;
        }, [currentUser, currentUserRole]);

        const handleFormSubmit = useCallback(
            async (e) => {
                e.preventDefault();
                if (!user?.clerk_id) return;

                setIsSubmitting(true);
                setError(null);

                try {
                    // Prepare the update data
                    const updateData = {
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        role: formData.role,
                        organisation_id: formData.organisation_id,
                    };

                    const success = await updateUser(user.clerk_id, updateData);
                    if (!success) throw new Error("Failed to update user");

                    // Show success toast
                    toast({
                        title: "Success",
                        description: "User updated successfully",
                    });

                    // Force refresh the table data and wait for it to complete
                    await Promise.all([
                        refreshData(true),
                        // If refreshUsers prop exists, call it too
                        refreshUsers?.(),
                    ]);

                    // Only close if successful
                    onOpenChange(false);
                } catch (err) {
                    console.error("Error updating user:", err);
                    setError(err.message);
                    toast({
                        title: "Error",
                        description: err.message,
                        variant: "destructive",
                    });
                } finally {
                    setIsSubmitting(false);
                }
            },
            [
                user?.clerk_id,
                formData,
                updateUser,
                refreshData,
                onOpenChange,
                toast,
                refreshUsers,
            ]
        );

        // Handle user deletion
        const handleDelete = async () => {
            if (!user?.clerk_id || !user?.role) return;

            try {
                // Use the deleteUser function from our consolidated hook
                await deleteUser(user.clerk_id, user.role);

                // Show success toast
                toast({
                    title: "User deleted",
                    description: "The user has been deleted successfully.",
                });

                // Force refresh both table data and wait for completion
                await Promise.all([
                    refreshData(true),
                    // If refreshUsers prop exists, call it too
                    refreshUsers?.(),
                ]);

                // Close both dialogs
                setShowConfirmation(false);
                onOpenChange(false);
            } catch (error) {
                console.error("Error deleting user:", error);
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            }
        };

        const handleOpenChange = (isOpen) => {
            // Only close if the org dialog is not open
            if (!isOpen && !isOrgDialogOpen) {
                onOpenChange(false);
            }
        };

        const handleAddOrganisationClick = () => {
            setIsOrgDialogOpen(true);
            onManageOrganisations((newOrg) => {
                setSelectedOrganisation(newOrg.id);
                handleInputChange("organisation_id", newOrg.id);
                setIsOrgDialogOpen(false);
            });
        };

        // Memoize dialog content
        const dialogContent = useMemo(
            () => (
                <form
                    id="edit-user-form"
                    onSubmit={handleFormSubmit}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First name</Label>
                            <Input
                                id="firstName"
                                value={formData.first_name}
                                onChange={(e) =>
                                    handleInputChange(
                                        "first_name",
                                        e.target.value
                                    )
                                }
                                disabled={!canModifyProfile || isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last name</Label>
                            <Input
                                id="lastName"
                                value={formData.last_name}
                                onChange={(e) =>
                                    handleInputChange(
                                        "last_name",
                                        e.target.value
                                    )
                                }
                                disabled={!canModifyProfile || isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={
                                user?.emailAddresses?.[0]?.emailAddress || ""
                            }
                            disabled={true}
                        />
                        <p className="text-sm text-muted-foreground">
                            Email cannot be changed as it is managed by the
                            authentication system.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            disabled={!canModifyRole || isSubmitting}
                            value={selectedRole}
                            onValueChange={(value) => {
                                handleInputChange("role", value);
                                setSelectedRole(value);
                            }}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {ROLE_LABELS[role]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!canModifyRole && (
                            <p className="col-span-3 col-start-2 text-sm text-muted-foreground">
                                {currentUser?.publicMetadata?.role ===
                                    USER_ROLES.MANAGER &&
                                user?.role !== USER_ROLES.AGENT
                                    ? "Managers can only modify agent roles."
                                    : "You don't have permission to change this user's role."}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="organisation">Organisation</Label>
                        <OrganisationDropdown
                            selectedOrganisation={selectedOrganisation}
                            onOrganisationChange={(orgId) => {
                                handleInputChange("organisation_id", orgId);
                                setSelectedOrganisation(orgId);
                            }}
                            onManageOrganisations={handleAddOrganisationClick}
                            disabled={!canModifyProfile || isSubmitting}
                            organisations={localOrganisations.orgs}
                        />
                    </div>
                    {error && (
                        <div className="text-sm text-destructive mt-2">
                            {error}
                        </div>
                    )}
                </form>
            ),
            [
                formData,
                handleInputChange,
                handleFormSubmit,
                isSubmitting,
                error,
                selectedRole,
                selectedOrganisation,
                canModifyRole,
                localOrganisations.orgs,
                availableRoles,
            ]
        );

        // Render nothing if not open
        if (!open) return null;

        return (
            <>
                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogContent
                        className="sm:max-w-[500px]"
                        onPointerDownOutside={(e) => {
                            // Prevent closing when org dialog is open
                            if (isOrgDialogOpen) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                                Make changes to the user's profile here.
                            </DialogDescription>
                        </DialogHeader>
                        {dialogContent}
                        <DialogFooter className="gap-2 sm:gap-0">
                            {/* Delete Button - only show if user has permission to delete this role */}
                            {((user?.role === "admin" && canDeleteUser) ||
                                (user?.role === "manager" && canDeleteUser) ||
                                (user?.role === "agent" && canDeleteUser)) && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setShowConfirmation(true)}
                                    disabled={isSubmitting}
                                >
                                    Delete User
                                </Button>
                            )}

                            <div className="flex flex-1 justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    form="edit-user-form"
                                    disabled={!canModifyProfile || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save changes"
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <ConfirmationDialog
                    open={showConfirmation}
                    onOpenChange={setShowConfirmation}
                    title="Delete User"
                    description={`Are you sure you want to delete the user ${
                        user?.name || "this user"
                    }? This action cannot be undone.`}
                    actionLabel="Delete"
                    actionVariant="destructive"
                    onAction={handleDelete}
                    loading={loading}
                />
            </>
        );
    }
);

EditUserDialog.displayName = "EditUserDialog";

EditUserDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onOpenChange: PropTypes.func.isRequired,
    user: PropTypes.object,
    refreshUsers: PropTypes.func,
    onManageOrganisations: PropTypes.func.isRequired,
};

export { EditUserDialog };
