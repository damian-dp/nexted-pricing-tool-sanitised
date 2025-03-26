import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/common/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="overflow-hidden px-4 md:px-6 lg:px-8">
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    );
}
