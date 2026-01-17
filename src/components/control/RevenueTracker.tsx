import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Activity, RefreshCw, ArrowUp, ArrowDown, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface RevenueRecord {
  id: string;
  amount: number;
  revenue_source: string;
  revenue_date: string;
  created_at: string;
  agent_id: string | null;
}

interface RevenueStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  change24h: number;
}

export function RevenueTracker() {
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [stats, setStats] = useState<RevenueStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    change24h: 0,
  });
  const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = async () => {
    try {
      const { data, error } = await supabase
        .from("autonomous_revenue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const records = data || [];
      setRecords(records);

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const total = records.reduce((acc, r) => acc + r.amount, 0);
      const today = records
        .filter((r) => new Date(r.created_at) >= todayStart)
        .reduce((acc, r) => acc + r.amount, 0);
      const thisWeek = records
        .filter((r) => new Date(r.created_at) >= weekStart)
        .reduce((acc, r) => acc + r.amount, 0);
      const thisMonth = records
        .filter((r) => new Date(r.created_at) >= monthStart)
        .reduce((acc, r) => acc + r.amount, 0);

      const yesterdayRevenue = records
        .filter((r) => {
          const d = new Date(r.created_at);
          return d >= yesterday && d < todayStart;
        })
        .reduce((acc, r) => acc + r.amount, 0);

      const change24h = yesterdayRevenue > 0 ? ((today - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

      setStats({ total, today, thisWeek, thisMonth, change24h });

      // Build chart data - last 7 days
      const chartMap = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        chartMap.set(key, 0);
      }

      records.forEach((r) => {
        const key = r.revenue_date.split("T")[0];
        if (chartMap.has(key)) {
          chartMap.set(key, (chartMap.get(key) || 0) + r.amount);
        }
      });

      const chartData = Array.from(chartMap.entries()).map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        revenue,
      }));

      setChartData(chartData);
    } catch (error) {
      console.error("Error fetching revenue:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();

    const channel = supabase
      .channel("revenue-tracker")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "autonomous_revenue" },
        () => fetchRevenue()
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchRevenue, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      api_calls: "bg-crypto-cyan/20 text-crypto-cyan border-crypto-cyan/30",
      payment_fees: "bg-crypto-green/20 text-crypto-green border-crypto-green/30",
      nft_sales: "bg-crypto-purple/20 text-crypto-purple border-crypto-purple/30",
      yield: "bg-warning/20 text-warning border-warning/30",
    };
    return <Badge className={colors[source] || "bg-muted text-muted-foreground"}>{source.replace("_", " ")}</Badge>;
  };

  if (loading) {
    return (
      <Card className="border-border bg-card/50">
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-crypto-green" />
          Real-Time Revenue Tracker
        </CardTitle>
        <CardDescription>
          Live revenue monitoring with automatic updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-crypto-green/10 border border-crypto-green/30">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-crypto-green">${stats.total.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-lg bg-crypto-cyan/10 border border-crypto-cyan/30">
            <p className="text-xs text-muted-foreground">Today</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-crypto-cyan">${stats.today.toFixed(2)}</p>
              {stats.change24h !== 0 && (
                <Badge
                  variant={stats.change24h > 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {stats.change24h > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(stats.change24h).toFixed(0)}%
                </Badge>
              )}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-crypto-purple/10 border border-crypto-purple/30">
            <p className="text-xs text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold text-crypto-purple">${stats.thisWeek.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold text-warning">${stats.thisMonth.toFixed(2)}</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Revenue Events
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {records.slice(0, 10).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {getSourceBadge(record.revenue_source)}
                  <div>
                    <p className="font-medium text-crypto-green">+${record.amount.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(record.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {records.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No revenue recorded yet</p>
                <p className="text-sm">Run an agent cycle to generate revenue</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
