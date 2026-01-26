import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Bot, 
  Settings,
  ChevronLeft,
  Zap,
  Shield,
  Brain,
  Server,
  Rocket,
  Store,
  Radar,
  Activity
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Sellers", url: "/sellers", icon: Users },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Pricing", url: "/pricing", icon: Zap },
];

const executionNavItems = [
  { title: "Orchestrator", url: "/full-power", icon: Rocket },
  { title: "Control Center", url: "/control", icon: Activity },
  { title: "Demand Radar", url: "/demand-radar", icon: Radar },
  { title: "Execution Engine", url: "/phoenix", icon: Server },
  { title: "AI Core", url: "/neural-brain", icon: Brain },
  { title: "Web3 Wallet", url: "/web3", icon: Wallet },
  { title: "Yield", url: "/yield", icon: TrendingUp },
  { title: "Agents", url: "/bots", icon: Bot },
];

const systemNavItems = [
  { title: "Admin", url: "/admin", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Server className="h-5 w-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground tracking-tight">XP Infra</span>
              <span className="text-xs text-muted-foreground font-mono">v1.0</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider font-mono">
            Core
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground"
                      activeClassName="bg-sidebar-accent text-foreground border-l-2 border-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider font-mono">
            Execution
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {executionNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground"
                      activeClassName="bg-sidebar-accent text-foreground border-l-2 border-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider font-mono">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground"
                      activeClassName="bg-sidebar-accent text-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarTrigger className="w-full justify-center rounded-md border border-sidebar-border bg-sidebar-accent p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
          <ChevronLeft className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  );
}
