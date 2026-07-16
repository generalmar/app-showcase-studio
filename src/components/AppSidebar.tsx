import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Layers, Palette, Image as ImageIcon, Eye, Upload } from "lucide-react";

export type DashboardSection =
  | "brand"
  | "screenshots"
  | "preview"
  | "publish";

const NAV_GROUPS: {
  label: string;
  items: { id: DashboardSection; title: string; icon: any }[];
}[] = [
  {
    label: "Design",
    items: [{ id: "brand", title: "Brand & Template", icon: Palette }],
  },
  {
    label: "Assets",
    items: [
      { id: "screenshots", title: "Screenshots", icon: ImageIcon },
      { id: "preview", title: "Preview & Export", icon: Eye },
    ],
  },
  {
    label: "Deliver",
    items: [{ id: "publish", title: "Publish to Stores", icon: Upload }],
  },
];

interface AppSidebarProps {
  active: DashboardSection;
  onSelect: (s: DashboardSection) => void;
}

export function AppSidebar({ active, onSelect }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
            <Layers size={18} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-mono font-bold tracking-tight gradient-text truncate">
                StoreReady
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                Store asset generator
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-mono uppercase tracking-wider">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={active === item.id}
                      onClick={() => onSelect(item.id)}
                      className="cursor-pointer"
                      tooltip={item.title}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="font-mono text-xs">{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
