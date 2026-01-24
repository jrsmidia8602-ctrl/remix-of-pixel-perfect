import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Loader2, Check } from "lucide-react";
import { supportedChains } from "@/lib/wagmi";
import { useToast } from "@/hooks/use-toast";

// Define wallet display options
const walletDisplayOptions: Record<string, { name: string; description: string; icon: string; gradient: string }> = {
  injected: {
    name: "MetaMask",
    description: "Browser extension wallet",
    icon: "🦊",
    gradient: "from-orange-400 to-orange-600",
  },
  walletConnect: {
    name: "WalletConnect",
    description: "Scan with mobile wallet",
    icon: "🔗",
    gradient: "from-blue-400 to-blue-600",
  },
};

export function WalletConnect() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  
  const { address, isConnected, chain } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  const { data: balance } = useBalance({
    address,
  });

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleConnect = async (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (!connector) return;
    
    setConnectingId(connectorId);
    
    try {
      await connectAsync({ connector });
      
      setDialogOpen(false);
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.warn("Wallet connection cancelled or failed:", errorMessage);
      
      // Only show error toast if it's not a user rejection
      if (
        !errorMessage.includes("User rejected") &&
        !errorMessage.includes("user rejected") &&
        !errorMessage.includes("cancelled") &&
        !errorMessage.includes("Connector not connected")
      ) {
        toast({
          title: "Connection Failed",
          description: "Failed to connect wallet. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const currentChain = supportedChains.find((c) => c.id === chain?.id);

  if (!isConnected) {
    return (
      <>
        <Button 
          variant="outline" 
          onClick={() => setDialogOpen(true)}
          className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
        >
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                Connect your wallet to access Web3 features and crypto payments.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {connectors.map((connector) => {
                const display = walletDisplayOptions[connector.id] || {
                  name: connector.name,
                  description: "Wallet connector",
                  icon: "💳",
                  gradient: "from-gray-400 to-gray-600",
                };
                
                return (
                  <Button
                    key={connector.id}
                    variant="outline"
                    className="w-full justify-start gap-3 h-14 border-border hover:bg-muted/50"
                    onClick={() => handleConnect(connector.id)}
                    disabled={connectingId !== null}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${display.gradient}`}>
                      <span className="text-white text-lg">{display.icon}</span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{display.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {display.description}
                      </span>
                    </div>
                    {connectingId === connector.id && (
                      <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                    )}
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Network Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 border-border bg-muted/50"
          >
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>{currentChain?.icon} {currentChain?.name || "Unknown"}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border">
          <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {supportedChains.map((c) => (
            <DropdownMenuItem 
              key={c.id}
              onClick={() => switchChain?.({ chainId: c.id })}
              className={chain?.id === c.id ? "bg-muted" : ""}
            >
              <span className="mr-2">{c.icon}</span>
              {c.name}
              {chain?.id === c.id && (
                <Check className="ml-auto h-4 w-4 text-success" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Wallet Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
          >
            <Wallet className="h-4 w-4" />
            <span>{formatAddress(address!)}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-card border-border">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>Connected Wallet</span>
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {formatAddress(address!)}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {balance && (
            <div className="px-2 py-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground mb-1">Balance</div>
                <div className="font-semibold">
                  {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                </div>
              </div>
            </div>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleCopyAddress}>
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-success" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copy Address
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => window.open(`https://basescan.org/address/${address}`, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}