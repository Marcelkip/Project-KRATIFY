"use client";

import * as React from "react";

import { NavUser } from "@/components/dashboard/sideBar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  BadgeQuestionMarkIcon,
  ChartLineIcon,
  CogIcon,
  LayoutPanelLeftIcon,
} from "lucide-react";
import { NavMain } from "./nav-main";
import { useSession } from "next-auth/react";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutPanelLeftIcon,
    },
    {
      title: "Rapportages",
      url: "/reports",
      icon: ChartLineIcon,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: CogIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: BadgeQuestionMarkIcon,
    },
  ],
};

export function DashboardSideBar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const user = session?.user ?? {
    name: "Unknown",
    email: "unknown@example.com",
    image: "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/home">
                <span className="text-base font-semibold">KRATTY.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
