import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Link2, CheckCircle, Copy, ExternalLink, ArrowRightLeft } from "lucide-react";

interface ConnectedWallet {
  address: string;
  chain: string;
  balance: string;
  isPrimary: boolean;
}

interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  status: "connected" | "available";
  color: string;
}

const connectedWallets: ConnectedWallet[] = [
  { address: "0x1234...5678", chain: "Base", balance: "12.5 ETH", isPrimary: true },
  { address: "0xabcd...efgh", chain: "Polygon", balance: "2,500 MATIC", isPrimary: false },
];

const chains: ChainConfig[] = [
  { name: "Base", chainId: 8453, rpcUrl: "https://base.drpc.org", status: "connected", color: "bg-crypto-blue" },
  { name: "Polygon", chainId: 137, rpcUrl: "https://polygon-rpc.com", status: "connected", color: "bg-crypto-purple" },
  { name: "Ethereum", chainId: 1, rpcUrl: "https://eth.drpc.org", status: "available", color: "bg-crypto-cyan" },
  { name: "Arbitrum", chainId: 42161, rpcUrl: "https://arb1.arbitrum.io/rpc", status: "available", color: "bg-crypto-pink" },
];

const contracts = [
  { name: "XpexSplitVault", address: "0xSplit...Vault", balance: "45.2 ETH" },
  { name: "XpexYieldVault", address: "0xYield...Vault", balance: "$125,430 TVL" },
  { name: "XpexNFTFactory", address: "0xNFT...Factory", balance: "1,245 minted" },
];

export default function Web3() {
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
          <Button className="gap-2 gradient-accent text-accent-foreground hover:opacity-90">
            <Wallet className="h-4 w-4" />
            Connect New Wallet
          </Button>
        </div>

        {/* Connected Wallets */}
        <div className="grid gap-4 md:grid-cols-2">
          {connectedWallets.map((wallet) => (
            <Card key={wallet.address} className="border-border bg-card/50 relative overflow-hidden">
              {wallet.isPrimary && (
                <div className="absolute right-0 top-0 gradient-primary px-3 py-1 text-xs font-medium text-primary-foreground rounded-bl-lg">
                  Primary
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-accent">
                        <Wallet className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <Badge variant="outline" className="border-crypto-cyan/50 text-crypto-cyan">
                        {wallet.chain}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg">{wallet.address}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="mt-1 text-2xl font-bold">{wallet.balance}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Connected</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chains & Contracts */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Supported Chains */}
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Supported Chains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chains.map((chain) => (
                  <div
                    key={chain.chainId}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${chain.color}`} />
                      <div>
                        <p className="font-medium">{chain.name}</p>
                        <p className="text-sm text-muted-foreground">Chain ID: {chain.chainId}</p>
                      </div>
                    </div>
                    {chain.status === "connected" ? (
                      <Badge className="bg-success/10 text-success border-success/20">Connected</Badge>
                    ) : (
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    )}
                  </div>
                ))}
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
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-6 py-8">
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-crypto-blue/20 border border-crypto-blue/50">
                    <span className="text-2xl font-bold text-crypto-blue">B</span>
                  </div>
                  <span className="text-sm font-medium">Base</span>
                </div>
                <div className="flex h-12 w-24 items-center justify-center">
                  <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-crypto-purple/20 border border-crypto-purple/50">
                    <span className="text-2xl font-bold text-crypto-purple">P</span>
                  </div>
                  <span className="text-sm font-medium">Polygon</span>
                </div>
              </div>
              <Button className="gradient-primary text-primary-foreground">
                Initiate Bridge Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
