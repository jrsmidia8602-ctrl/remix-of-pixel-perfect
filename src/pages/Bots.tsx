import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bot, Play, Pause, Settings, TrendingUp, DollarSign, Activity, AlertTriangle } from "lucide-react";

interface TradingBot {
  id: string;
  name: string;
  type: "market_maker" | "arbitrage" | "volume" | "yield";
  status: "running" | "paused" | "error";
  pnl: string;
  pnlChange: "positive" | "negative";
  trades: number;
  winRate: string;
  dailyBudget: string;
  lastActivity: string;
}

const tradingBots: TradingBot[] = [
  { id: "1", name: "ETH Market Maker", type: "market_maker", status: "running", pnl: "+$2,450", pnlChange: "positive", trades: 1245, winRate: "68%", dailyBudget: "$5,000", lastActivity: "2 min ago" },
  { id: "2", name: "DEX Arbitrage", type: "arbitrage", status: "running", pnl: "+$890", pnlChange: "positive", trades: 89, winRate: "92%", dailyBudget: "$10,000", lastActivity: "45 sec ago" },
  { id: "3", name: "Volume Bot Alpha", type: "volume", status: "paused", pnl: "-$120", pnlChange: "negative", trades: 456, winRate: "52%", dailyBudget: "$2,000", lastActivity: "1 hour ago" },
  { id: "4", name: "Yield Optimizer", type: "yield", status: "running", pnl: "+$1,200", pnlChange: "positive", trades: 24, winRate: "88%", dailyBudget: "$25,000", lastActivity: "5 min ago" },
  { id: "5", name: "Flash Loan Bot", type: "arbitrage", status: "error", pnl: "+$3,400", pnlChange: "positive", trades: 12, winRate: "100%", dailyBudget: "$50,000", lastActivity: "30 min ago" },
];

const typeConfig = {
  market_maker: { label: "Market Maker", color: "bg-crypto-purple/10 text-crypto-purple border-crypto-purple/20" },
  arbitrage: { label: "Arbitrage", color: "bg-crypto-cyan/10 text-crypto-cyan border-crypto-cyan/20" },
  volume: { label: "Volume", color: "bg-crypto-blue/10 text-crypto-blue border-crypto-blue/20" },
  yield: { label: "Yield", color: "bg-crypto-green/10 text-crypto-green border-crypto-green/20" },
};

const statusConfig = {
  running: { label: "Running", color: "bg-success/10 text-success border-success/20", icon: Play },
  paused: { label: "Paused", color: "bg-warning/10 text-warning border-warning/20", icon: Pause },
  error: { label: "Error", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
};

export default function Bots() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trading Bots</h1>
            <p className="text-muted-foreground">
              Manage automated trading strategies and monitor performance.
            </p>
          </div>
          <Button className="gap-2 gradient-primary text-primary-foreground hover:opacity-90">
            <Bot className="h-4 w-4" />
            Deploy New Bot
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-crypto-purple" />
                <span className="text-sm text-muted-foreground">Active Bots</span>
              </div>
              <div className="mt-2 text-2xl font-bold">3 / 5</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Total PnL</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-success">+$7,820</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-crypto-cyan" />
                <span className="text-sm text-muted-foreground">Total Trades</span>
              </div>
              <div className="mt-2 text-2xl font-bold">1,826</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-crypto-purple" />
                <span className="text-sm text-muted-foreground">Avg Win Rate</span>
              </div>
              <div className="mt-2 text-2xl font-bold">80%</div>
            </CardContent>
          </Card>
        </div>

        {/* Bot Cards */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {tradingBots.map((bot) => {
            const type = typeConfig[bot.type];
            const status = statusConfig[bot.status];
            const StatusIcon = status.icon;
            
            return (
              <Card key={bot.id} className="border-border bg-card/50 hover:border-primary/50 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{bot.name}</CardTitle>
                        <Badge variant="outline" className={type.color}>
                          {type.label}
                        </Badge>
                      </div>
                    </div>
                    <Switch checked={bot.status === "running"} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Status & PnL */}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={status.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                      <span className={`text-xl font-bold ${bot.pnlChange === "positive" ? "text-success" : "text-destructive"}`}>
                        {bot.pnl}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-muted-foreground">Trades</p>
                        <p className="text-lg font-semibold">{bot.trades.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-muted-foreground">Win Rate</p>
                        <p className="text-lg font-semibold text-crypto-cyan">{bot.winRate}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-muted-foreground">Daily Budget</p>
                        <p className="text-lg font-semibold">{bot.dailyBudget}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-muted-foreground">Last Active</p>
                        <p className="text-lg font-semibold">{bot.lastActivity}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Activity className="mr-2 h-4 w-4" />
                        Logs
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
