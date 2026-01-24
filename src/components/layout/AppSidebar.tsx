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
  Flame,
  Rocket,
  Sparkles,
  Store,
  Radar
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
  { title: "Pricing", url: "/pricing", icon: Sparkles },
];

const web3NavItems = [
  { title: "Full Power", url: "/full-power", icon: Zap },
  { title: "Control Center", url: "/control", icon: Rocket },
  { title: "Demand Radar", url: "/demand-radar", icon: Radar },
  { title: "Phoenix Engine", url: "/phoenix", icon: Flame },
  { title: "Neural Brain", url: "/neural-brain", icon: Brain },
  { title: "Web3 Wallet", url: "/web3", icon: Wallet },
  { title: "Yield Strategies", url: "/yield", icon: TrendingUp },
  { title: "Trading Bots", url: "/bots", icon: Bot },
];

const settingsNavItems = [
  { title: "Admin", url: "/admin", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary glow-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gradient-primary">XPEX</span>
              <span className="text-xs text-muted-foreground">Neural Supreme</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground"
                      activeClassName="bg-sidebar-accent text-foreground border-l-2 border-primary"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            Web3 & DeFi
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {web3NavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground"
                      activeClassName="bg-sidebar-accent text-foreground border-l-2 border-accent"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground"
                      activeClassName="bg-sidebar-accent text-foreground"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarTrigger className="w-full justify-center rounded-lg border border-border bg-sidebar-accent p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
          <ChevronLeft className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  );
}
