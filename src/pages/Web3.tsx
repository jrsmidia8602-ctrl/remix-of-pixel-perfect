import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Link2, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  ArrowRightLeft,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useAccount, useBalance, useSwitchChain, useConnect, useDisconnect } from "wagmi";
import { supportedChains } from "@/lib/wagmi";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const contracts = [
  { name: "XpexSplitVault", address: "0xSplit...Vault", balance: "45.2 ETH" },
  { name: "XpexYieldVault", address: "0xYield...Vault", balance: "$125,430 TVL" },
  { name: "XpexNFTFactory", address: "0xNFT...Factory", balance: "1,245 minted" },
];

export default function Web3() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  const { data: balance, refetch: refetchBalance } = useBalance({
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

  const handleConnectWallet = () => {
    const injectedConnector = connectors.find(c => c.id === "injected");
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  const getExplorerUrl = () => {
    if (!address || !chain) return "#";
    
    const explorers: Record<number, string> = {
      8453: "https://basescan.org",
      1: "https://etherscan.io",
      137: "https://polygonscan.com",
    };
    
    return `${explorers[chain.id] || explorers[8453]}/address/${address}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Web3 Wallet</h1>
            <p className="text-muted-foreground">
              Connect wallets and manage your on-chain assets.
            </p>
          </div>
          {!isConnected ? (
            <Button 
              onClick={handleConnectWallet}
              className="gap-2 gradient-accent text-accent-foreground hover:opacity-90"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={() => refetchBalance()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Balance
            </Button>
          )}
        </div>

        {/* Connected Wallet Card */}
        {isConnected && address ? (
          <Card className="border-border bg-card/50 relative overflow-hidden">
            <div className="absolute right-0 top-0 gradient-primary px-3 py-1 text-xs font-medium text-primary-foreground rounded-bl-lg">
              Primary
            </div>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-accent">
                      <Wallet className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <Badge variant="outline" className="border-crypto-cyan/50 text-crypto-cyan">
                      {chain?.name || "Unknown Chain"}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg">{formatAddress(address)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={handleCopyAddress}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => window.open(getExplorerUrl(), "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    {balance && (
                      <p className="mt-1 text-2xl font-bold">
                        {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Connected</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => disconnect()}
                    className="text-destructive hover:text-destructive"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Wallet Connected</h3>
              <p className="text-muted-foreground text-center mb-4">
                Connect your wallet to view balances and interact with smart contracts.
              </p>
              <Button 
                onClick={handleConnectWallet}
                className="gradient-primary text-primary-foreground"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Chains & Contracts */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Supported Chains */}
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Supported Chains
              </CardTitle>
              <CardDescription>
                Switch between networks to interact with different chains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supportedChains.map((c) => {
                  const isCurrentChain = chain?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                        isCurrentChain 
                          ? "border-primary/50 bg-primary/5" 
                          : "border-border bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.icon}</span>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-sm text-muted-foreground">Chain ID: {c.id}</p>
                        </div>
                      </div>
                      {isConnected && isCurrentChain ? (
                        <Badge className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Connected
                        </Badge>
                      ) : isConnected ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => switchChain?.({ chainId: c.id })}
                        >
                          Switch
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Available
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Smart Contracts */}
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Smart Contracts
              </CardTitle>
              <CardDescription>
                Platform smart contracts and their current state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <div
                    key={contract.name}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div>
                      <p className="font-medium">{contract.name}</p>
                      <p className="font-mono text-sm text-muted-foreground">{contract.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-crypto-cyan">{contract.balance}</p>
                      <Button variant="link" className="h-auto p-0 text-sm">
                        View on Explorer
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cross-Chain Bridge */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle>Cross-Chain Bridge</CardTitle>
            <CardDescription>
              Transfer assets between supported chains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-6 py-8">
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-crypto-blue/20 border border-crypto-blue/50">
                    <span className="text-2xl font-bold text-crypto-blue">🔵</span>
                  </div>
                  <span className="text-sm font-medium">Base</span>
                </div>
                <div className="flex h-12 w-24 items-center justify-center">
                  <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-crypto-purple/20 border border-crypto-purple/50">
                    <span className="text-2xl font-bold text-crypto-purple">🟣</span>
                  </div>
                  <span className="text-sm font-medium">Polygon</span>
                </div>
              </div>
              <Button 
                className="gradient-primary text-primary-foreground"
                disabled={!isConnected}
              >
                {isConnected ? "Initiate Bridge Transfer" : "Connect Wallet First"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
