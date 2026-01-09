import { Bell, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { WalletConnect } from "@/components/WalletConnect";

export function TopNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search transactions, sellers..." 
            className="w-80 bg-muted/50 pl-10 border-border focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Wallet Connect */}
        <WalletConnect />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs gradient-primary border-0">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card border-border">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <span className="font-medium">New payment received</span>
              <span className="text-xs text-muted-foreground">0.5 ETH from 0x1234...5678</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <span className="font-medium">Yield claimed</span>
              <span className="text-xs text-muted-foreground">+$245.00 from Aave position</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <span className="font-medium">Bot alert</span>
              <span className="text-xs text-muted-foreground">Arbitrage bot paused - low liquidity</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>My Account</span>
                {user && (
                  <span className="text-xs font-normal text-muted-foreground truncate max-w-[180px]">
                    {user.email}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>Profile</DropdownMenuItem>
            <DropdownMenuItem>API Keys</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
