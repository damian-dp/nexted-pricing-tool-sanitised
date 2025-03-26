import * as React from "react";
import { Link, useLocation } from "react-router-dom";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    RiScanLine,
    RiSettings3Line,
    RiLogoutBoxLine,
    RiUserLine,
} from "@remixicon/react";
import { useRole } from "@/providers/RoleProvider";
import { USER_ROLES } from "@/constants";

export function AppSidebar({ ...props }) {
    const location = useLocation();
    const { role } = useRole();

    const navMain = [
        {
            title: "Main",
            items: [
                {
                    title: "Dashboard",
                    url: "/dashboard",
                    icon: RiScanLine,
                    isActive: location.pathname === "/dashboard",
                },
                // Only show Users link for admins and managers
                ...(role !== USER_ROLES.AGENT
                    ? [
                          {
                              title: "Users",
                              url: "/users",
                              icon: RiUserLine,
                              isActive: location.pathname === "/users",
                          },
                      ]
                    : []),
                {
                    title: "Rules",
                    url: "/rules",
                    icon: RiSettings3Line,
                    isActive: location.pathname === "/rules",
                },
            ],
        },
        {
            title: "Other",
            items: [
                {
                    title: "Settings",
                    url: "#",
                    icon: RiSettings3Line,
                },
            ],
        },
    ];

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <p>header</p>
                <hr className="border-t border-border mx-2 -mt-px" />
            </SidebarHeader>
            <SidebarContent>
                {navMain.map((item) => (
                    <SidebarGroup key={item.title}>
                        <SidebarGroupLabel className="uppercase text-muted-foreground/60">
                            {item.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent className="px-2">
                            <SidebarMenu>
                                {item.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            className="group/menu-button font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto"
                                            isActive={item.isActive}
                                        >
                                            <Link to={item.url}>
                                                {item.icon && (
                                                    <item.icon
                                                        className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                                                        size={22}
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <hr className="border-t border-border mx-2 -mt-px" />
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto">
                            <RiLogoutBoxLine
                                className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                                size={22}
                                aria-hidden="true"
                            />
                            <span>Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
