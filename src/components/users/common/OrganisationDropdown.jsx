import { memo, useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, Plus, LoaderCircleIcon } from "lucide-react";
import { useSharedUsersManagement } from "@/providers/UsersManagementProvider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from "@/components/ui/select";

const OrganisationDropdown = memo(
    ({
        selectedOrganisation,
        onOrganisationChange,
        onManageOrganisations,
        disabled = false,
        className = "",
        organisations: externalOrgs,
    }) => {
        const { organisations: rawOrganisations, isLoading } =
            useSharedUsersManagement();

        // Use external orgs if provided, otherwise use shared state
        const organisations = externalOrgs || rawOrganisations;

        // Update local state only when selected org changes
        const handleOrganisationChange = useCallback(
            (newValue) => {
                onOrganisationChange?.(newValue === "none" ? "" : newValue);
            },
            [onOrganisationChange]
        );

        // Convert empty string to "none" for the Select component
        const selectValue = selectedOrganisation || "none";

        return (
            <div className={className}>
                <Select
                    value={selectValue}
                    onValueChange={handleOrganisationChange}
                    disabled={disabled || isLoading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select organisation" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {organisations?.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                                {org.name}
                            </SelectItem>
                        ))}
                        {onManageOrganisations && (
                            <>
                                <SelectSeparator />
                                <button
                                    className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onManageOrganisations();
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Manage Organisations
                                </button>
                            </>
                        )}
                    </SelectContent>
                </Select>
            </div>
        );
    }
);

OrganisationDropdown.displayName = "OrganisationDropdown";

OrganisationDropdown.propTypes = {
    selectedOrganisation: PropTypes.string,
    onOrganisationChange: PropTypes.func.isRequired,
    onManageOrganisations: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    organisations: PropTypes.array,
};

export default OrganisationDropdown;
