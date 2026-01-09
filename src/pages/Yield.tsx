import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Plus, ArrowUpRight, ArrowDownRight, Percent, DollarSign } from "lucide-react";

interface YieldPosition {
  id: string;
  protocol: string;
  protocolIcon: string;
  asset: string;
  deposited: string;
  currentValue: string;
  apy: string;
  earned: string;
  chain: string;
}

const yieldPositions: YieldPosition[] = [
  { id: "1", protocol: "Aave", protocolIcon: "A", asset: "USDC", deposited: "$50,000", currentValue: "$52,450", apy: "8.5%", earned: "$2,450", chain: "Base" },
  { id: "2", protocol: "Compound", protocolIcon: "C", asset: "ETH", deposited: "20 ETH", currentValue: "20.8 ETH", apy: "4.2%", earned: "0.8 ETH", chain: "Ethereum" },
  { id: "3", protocol: "Uniswap V3", protocolIcon: "U", asset: "ETH/USDC", deposited: "$30,000", currentValue: "$34,200", apy: "24.8%", earned: "$4,200", chain: "Base" },
  { id: "4", protocol: "Curve", protocolIcon: "Cv", asset: "3pool", deposited: "$25,000", currentValue: "$26,100", apy: "6.8%", earned: "$1,100", chain: "Polygon" },
];

const protocolColors: Record<string, string> = {
  Aave: "bg-crypto-purple",
  Compound: "bg-crypto-green",
  "Uniswap V3": "bg-crypto-pink",
  Curve: "bg-crypto-blue",
};

export default function Yield() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yield Strategies</h1>
            <p className="text-muted-foreground">
              Manage your DeFi positions and maximize returns.
            </p>
          </div>
          <Button className="gap-2 gradient-success text-success-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            New Position
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-crypto-cyan" />
                <span className="text-sm text-muted-foreground">Total Deposited</span>
              </div>
              <div className="mt-2 text-2xl font-bold">$125,000</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Current Value</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-success">$132,750</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-crypto-purple" />
                <span className="text-sm text-muted-foreground">Total Earned</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-crypto-purple">$7,750</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-crypto-cyan" />
                <span className="text-sm text-muted-foreground">Avg APY</span>
              </div>
              <div className="mt-2 text-2xl font-bold">11.08%</div>
            </CardContent>
          </Card>
        </div>

        {/* Yield Positions */}
        <div className="grid gap-4 lg:grid-cols-2">
          {yieldPositions.map((position) => (
            <Card key={position.id} className="border-border bg-card/50 hover:border-primary/50 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${protocolColors[position.protocol]}`}>
                      <span className="text-sm font-bold text-white">{position.protocolIcon}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{position.protocol}</CardTitle>
                      <CardDescription>{position.asset}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-crypto-cyan/50 text-crypto-cyan">
                    {position.chain}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Deposited</p>
                      <p className="text-lg font-semibold">{position.deposited}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="text-lg font-semibold text-success">{position.currentValue}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">APY</span>
                      <span className="font-semibold text-crypto-cyan">{position.apy}</span>
                    </div>
                    <Progress value={parseFloat(position.apy)} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-success/10 p-3">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-success" />
                      <span className="text-sm text-muted-foreground">Earned</span>
                    </div>
                    <span className="font-semibold text-success">{position.earned}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <ArrowDownRight className="mr-2 h-4 w-4" />
                      Withdraw
                    </Button>
                    <Button className="flex-1 gradient-primary text-primary-foreground">
                      <Plus className="mr-2 h-4 w-4" />
                      Add More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
