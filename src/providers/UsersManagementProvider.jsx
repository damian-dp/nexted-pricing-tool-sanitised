import React, { createContext, useContext } from "react";
import { useUsersManagement } from "@/hooks/useUsersManagement";

const UsersManagementContext = createContext(null);

export function UsersManagementProvider({ children }) {
    const usersManagementState = useUsersManagement();

    return (
        <UsersManagementContext.Provider value={usersManagementState}>
            {children}
        </UsersManagementContext.Provider>
    );
}

export function useSharedUsersManagement() {
    const context = useContext(UsersManagementContext);
    if (!context) {
        throw new Error(
            "useSharedUsersManagement must be used within a UsersManagementProvider"
        );
    }
    return context;
}
