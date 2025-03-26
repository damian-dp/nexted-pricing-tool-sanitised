import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layouts/AppLayout";
import { DashboardPage } from "@/pages/app/DashboardPage";
import UsersPage from "@/pages/app/UsersPage";
import RulesPage from "@/pages/app/RulesPage";
import RoleProvider from "@/providers/RoleProvider";
import { UsersManagementProvider } from "@/providers/UsersManagementProvider";

// Protected pages with their specific providers
const Dashboard = () => <DashboardPage />;

const Users = () => (
    <UsersManagementProvider>
        <UsersPage />
    </UsersManagementProvider>
);

const Rules = () => <RulesPage />;

// Routes for App Pages
export function AppRoutes() {
    return (
        <RoleProvider>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/rules" element={<Rules />} />
                </Route>
            </Routes>
        </RoleProvider>
    );
}
