"use client";

import { cn } from "@/lib/utils/styles";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    CheckIcon,
    CopyIcon,
    ChevronDownIcon,
    LoaderCircleIcon,
    UserRoundPlusIcon,
    UserPlusIcon,
    Plus,
} from "lucide-react";
import { useId, useRef, useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useRole } from "@/providers/RoleProvider";
import {
    USER_ROLES,
    ROLE_LABELS,
    ROLE_HIERARCHY,
    ROLE_CAPABILITIES,
} from "@/constants";
import { RiErrorWarningLine } from "@remixicon/react";
import { useSharedUsersManagement } from "@/providers/UsersManagementProvider";
import OrganisationDropdown from "@/components/users/common/OrganisationDropdown";

// Get available roles based on user's role
function getAvailableRoles(userRole) {
    if (!userRole) return [];

    const capabilities = ROLE_CAPABILITIES[userRole] || {};
    const roles = [];

    // Check capabilities with safe access
    if (capabilities.canInviteAdmins) roles.push(USER_ROLES.ADMIN);
    if (capabilities.canInviteManagers) roles.push(USER_ROLES.MANAGER);
    if (capabilities.canInviteAgents) roles.push(USER_ROLES.AGENT);

    return roles;
}

export function InviteUserDialog({
    open,
    onOpenChange,
    onManageOrganisations,
}) {
    const id = useId();
    const { role: userRole, capabilities } = useRole();
    const availableRoles = getAvailableRoles(userRole);
    const defaultRole = availableRoles[0] || USER_ROLES.AGENT;
    const effectiveRole = userRole;
    const { organisations, refreshData, sendInvitation } =
        useSharedUsersManagement();
    const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);

    const [invites, setInvites] = useState([
        { email: "", role: defaultRole, organisation: "" },
    ]);
    const [copied, setCopied] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [showAddOrgDialog, setShowAddOrgDialog] = useState(false);
    const [currentInviteIndexForOrg, setCurrentInviteIndexForOrg] =
        useState(null);
    const inputRef = useRef(null);
    const lastInputRef = useRef(null);
    const { getToken } = useAuth();

    const addInvite = () => {
        setInvites([
            ...invites,
            { email: "", role: defaultRole, organisation: "" },
        ]);
    };

    const handleEmailChange = (index, value) => {
        const newInvites = [...invites];
        newInvites[index] = { ...newInvites[index], email: value };
        setInvites(newInvites);
        if (error) setError(null);
    };

    const handleRoleChange = (index, role) => {
        // Only allow role change if user has permission and role is in available roles
        const availableRoles = getAvailableRoles(effectiveRole);
        if (availableRoles.includes(role)) {
            const newInvites = [...invites];
            newInvites[index] = { ...newInvites[index], role };
            setInvites(newInvites);
        }
    };

    const handleOrganisationChange = (index, orgId) => {
        const newInvites = [...invites];
        newInvites[index] = { ...newInvites[index], organisation: orgId };
        setInvites(newInvites);
    };

    const handleAddOrganisationClick = (index) => {
        setCurrentInviteIndexForOrg(index);
        setIsOrgDialogOpen(true);
        onManageOrganisations((newOrg) => {
            const newInvites = [...invites];
            newInvites[index] = {
                ...newInvites[index],
                organisation: newOrg.id,
            };
            setInvites(newInvites);
            setIsOrgDialogOpen(false);
        });
    };

    const handleCopy = () => {
        if (inputRef.current) {
            navigator.clipboard.writeText(inputRef.current.value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    const resetForm = () => {
        setInvites([{ email: "", role: defaultRole, organisation: "" }]);
        setError(null);
    };

    const handleDialogClose = (isOpen) => {
        if (!isOpen && !isOrgDialogOpen) {
            resetForm();
            onOpenChange(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSending(true);
            setError(null);

            const capabilities = ROLE_CAPABILITIES[effectiveRole];
            const availableRoles = getAvailableRoles(effectiveRole);

            // Check if user can invite any roles
            if (availableRoles.length === 0) {
                setError("You do not have permission to invite users.");
                return;
            }

            const invalidEmails = invites
                .filter((invite) => invite.email.trim())
                .filter(
                    (invite) =>
                        !invite.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
                );

            if (invalidEmails.length > 0) {
                setError(
                    `Invalid email format for: ${invalidEmails
                        .map((i) => i.email)
                        .join(", ")}`
                );
                return;
            }

            const validInvites = invites.filter((invite) =>
                invite.email.trim()
            );

            // Validate that each invite has an organisation selected
            if (validInvites.some((invite) => !invite.organisation)) {
                setError("Please select an organisation for each invite.");
                setSending(false);
                return;
            }

            // Validate that each invite role is allowed for the current user
            const invalidRoles = validInvites.filter(
                (invite) => !availableRoles.includes(invite.role)
            );
            if (invalidRoles.length > 0) {
                setError(
                    `You do not have permission to assign the following roles: ${invalidRoles
                        .map((i) => ROLE_LABELS[i.role])
                        .join(", ")}`
                );
                return;
            }

            const session = await window.Clerk.session;
            if (!session) {
                throw new Error("No active session found");
            }

            // Get the JWT token for Supabase authentication
            const token = await getToken({ template: "supabase" });
            if (!token) {
                throw new Error("Failed to get authentication token");
            }

            if (process.env.NODE_ENV === "development") {
                console.log("Sending invites:", validInvites);
            }

            // Use sendInvitation function from useUserManagement hook
            const success = await sendInvitation(validInvites, session.id);

            if (!success) {
                throw new Error("Failed to send invites");
            }

            // Refresh all data
            await refreshData();

            handleDialogClose(false);
        } catch (err) {
            console.error("Error sending invites:", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogContent
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    lastInputRef.current?.focus();
                }}
                onCloseAutoFocus={(e) => {
                    e.preventDefault();
                    resetForm();
                }}
                onPointerDownOutside={(e) => {
                    if (isOrgDialogOpen) {
                        e.preventDefault();
                    }
                }}
                className="max-w-lg"
            >
                <div className="flex flex-col gap-2">
                    <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-full border"
                        aria-hidden="true"
                    >
                        <UserRoundPlusIcon className="opacity-80" size={16} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-left">
                            Add users
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            Invite users to create an account.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 mt-2">
                    <div className="space-y-8">
                        {invites.map((invite, index) => (
                            <div key={index} className="space-y-4">
                                {index > 0 && (
                                    <div
                                        className="h-px bg-border -mx-6 mb-7"
                                        aria-hidden="true"
                                    />
                                )}
                                <div className="*:not-first:mt-2">
                                    <Label htmlFor={`team-email-${index + 1}`}>
                                        Email
                                    </Label>
                                    <Input
                                        id={`team-email-${index + 1}`}
                                        placeholder="hi@yourcompany.com"
                                        type="email"
                                        value={invite.email}
                                        onChange={(e) =>
                                            handleEmailChange(
                                                index,
                                                e.target.value
                                            )
                                        }
                                        ref={
                                            index === invites.length - 1
                                                ? lastInputRef
                                                : undefined
                                        }
                                        disabled={sending}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="*:not-first:mt-2">
                                        <Label>Role</Label>
                                        {availableRoles.length > 0 ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        disabled={sending}
                                                        className="w-full justify-between"
                                                    >
                                                        <span className="truncate">
                                                            {ROLE_LABELS[
                                                                invite.role
                                                            ] || "Agent"}
                                                        </span>
                                                        <ChevronDownIcon
                                                            className="h-4 w-4 opacity-50 flex-shrink-0 ml-2"
                                                            aria-hidden="true"
                                                        />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="start"
                                                    className="w-[var(--radix-dropdown-menu-trigger-width)]"
                                                >
                                                    {availableRoles.map(
                                                        (role) => (
                                                            <DropdownMenuCheckboxItem
                                                                key={role}
                                                                checked={
                                                                    invite.role ===
                                                                    role
                                                                }
                                                                onCheckedChange={() =>
                                                                    handleRoleChange(
                                                                        index,
                                                                        role
                                                                    )
                                                                }
                                                            >
                                                                {
                                                                    ROLE_LABELS[
                                                                        role
                                                                    ]
                                                                }
                                                            </DropdownMenuCheckboxItem>
                                                        )
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                disabled
                                                className="w-full justify-between"
                                            >
                                                <span className="truncate">
                                                    {ROLE_LABELS[invite.role] ||
                                                        "Agent"}
                                                </span>
                                            </Button>
                                        )}
                                        {availableRoles.length === 0 && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                You do not have permission to
                                                invite users.
                                            </p>
                                        )}
                                    </div>

                                    {ROLE_CAPABILITIES[effectiveRole]
                                        ?.canManageOrganisations && (
                                        <div className="*:not-first:mt-2">
                                            <Label>Organisation</Label>
                                            <OrganisationDropdown
                                                selectedOrganisation={
                                                    invite.organisation
                                                }
                                                onOrganisationChange={(orgId) =>
                                                    handleOrganisationChange(
                                                        index,
                                                        orgId
                                                    )
                                                }
                                                onManageOrganisations={() =>
                                                    handleAddOrganisationClick(
                                                        index
                                                    )
                                                }
                                                disabled={sending}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={addInvite}
                        disabled={sending}
                        className="w-full"
                    >
                        <Plus />
                        Add another user
                    </Button>

                    <div className="flex flex-col gap-6">
                        {error && (
                            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                <div className="flex">
                                    <RiErrorWarningLine
                                        className="h-5 w-5 flex-shrink-0"
                                        aria-hidden="true"
                                    />
                                    <div className="ml-3 flex-1 whitespace-pre-line">
                                        {error}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleDialogClose(false)}
                                disabled={sending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    sending ||
                                    !invites.some((invite) =>
                                        invite.email.trim()
                                    )
                                }
                            >
                                {sending ? (
                                    <>
                                        <LoaderCircleIcon className="animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <UserPlusIcon />
                                        Send invites
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
