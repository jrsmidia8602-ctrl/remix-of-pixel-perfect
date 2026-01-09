import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useVaultContracts } from "@/hooks/useVaultContracts";
import { TrendingUp, Plus, ArrowUpRight, ArrowDownRight, Percent, DollarSign, Wallet, Loader2, Zap, Coins } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Yield() {
  const {
    isConnected,
    splitVault,
    yieldVault,
    depositToSplitVault,
    withdrawFromSplitVault,
    claimSplitRewards,
    depositToYieldVault,
    withdrawFromYieldVault,
    harvestYield,
    isPending,
    contracts,
  } = useVaultContracts();

  const [splitDepositAmount, setSplitDepositAmount] = useState("");
  const [splitWithdrawAmount, setSplitWithdrawAmount] = useState("");
  const [yieldDepositAmount, setYieldDepositAmount] = useState("");
  const [yieldWithdrawAmount, setYieldWithdrawAmount] = useState("");

  const handleSplitDeposit = () => {
    if (!splitDepositAmount || parseFloat(splitDepositAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    depositToSplitVault(splitDepositAmount);
    toast.info("Transaction submitted...");
  };

  const handleSplitWithdraw = () => {
    if (!splitWithdrawAmount || parseFloat(splitWithdrawAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    withdrawFromSplitVault(splitWithdrawAmount);
    toast.info("Transaction submitted...");
  };

  const handleYieldDeposit = () => {
    if (!yieldDepositAmount || parseFloat(yieldDepositAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    depositToYieldVault(yieldDepositAmount);
    toast.info("Transaction submitted...");
  };

  const handleYieldWithdraw = () => {
    if (!yieldWithdrawAmount || parseFloat(yieldWithdrawAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    withdrawFromYieldVault(yieldWithdrawAmount);
    toast.info("Transaction submitted...");
  };

  const handleClaimRewards = () => {
    claimSplitRewards();
    toast.info("Claiming rewards...");
  };

  const handleHarvest = () => {
    harvestYield();
    toast.info("Harvesting yield...");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yield Strategies</h1>
            <p className="text-muted-foreground">
              Manage your XPEX vault positions and maximize returns.
            </p>
          </div>
          {!isConnected && (
            <Badge variant="outline" className="border-warning text-warning">
              Connect wallet to interact
            </Badge>
          )}
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-crypto-cyan" />
                <span className="text-sm text-muted-foreground">Split Vault TVL</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{parseFloat(splitVault.totalDeposits).toFixed(4)} ETH</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Yield Vault TVL</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-success">{parseFloat(yieldVault.totalAssets).toFixed(4)} ETH</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-crypto-purple" />
                <span className="text-sm text-muted-foreground">Pending Rewards</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-crypto-purple">{parseFloat(splitVault.pendingRewards).toFixed(6)} ETH</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-crypto-cyan" />
                <span className="text-sm text-muted-foreground">Current APY</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{yieldVault.currentAPY.toFixed(2)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Vault Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* XpexSplitVault */}
          <Card className="border-border bg-card/50 hover:border-primary/50 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-crypto-purple">
                    <Coins className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">XpexSplitVault</CardTitle>
                    <CardDescription>Revenue splitting vault</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="border-crypto-cyan/50 text-crypto-cyan">
                  Base
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Balance</p>
                    <p className="text-lg font-semibold">{parseFloat(splitVault.balance).toFixed(6)} ETH</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Split Ratio</p>
                    <p className="text-lg font-semibold text-success">{splitVault.splitRatio}%</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending Rewards</span>
                    <span className="font-semibold text-crypto-cyan">{parseFloat(splitVault.pendingRewards).toFixed(6)} ETH</span>
                  </div>
                  <Progress value={Math.min(parseFloat(splitVault.pendingRewards) * 100, 100)} className="h-2" />
                </div>

                {/* Deposit */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Deposit ETH</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={splitDepositAmount}
                      onChange={(e) => setSplitDepositAmount(e.target.value)}
                      disabled={!isConnected || isPending}
                    />
                    <Button 
                      onClick={handleSplitDeposit}
                      disabled={!isConnected || isPending}
                      className="gradient-primary text-primary-foreground"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Withdraw */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Withdraw Shares</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={splitWithdrawAmount}
                      onChange={(e) => setSplitWithdrawAmount(e.target.value)}
                      disabled={!isConnected || isPending}
                    />
                    <Button 
                      variant="outline"
                      onClick={handleSplitWithdraw}
                      disabled={!isConnected || isPending}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  className="w-full gradient-success text-success-foreground"
                  onClick={handleClaimRewards}
                  disabled={!isConnected || isPending || parseFloat(splitVault.pendingRewards) === 0}
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  Claim Rewards
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Contract: {contracts.splitVault.slice(0, 10)}...{contracts.splitVault.slice(-8)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* XpexYieldVault */}
          <Card className="border-border bg-card/50 hover:border-accent/50 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-crypto-green">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">XpexYieldVault</CardTitle>
                    <CardDescription>Yield optimization vault</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="border-crypto-cyan/50 text-crypto-cyan">
                  Base
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Shares</p>
                    <p className="text-lg font-semibold">{parseFloat(yieldVault.balance).toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current APY</p>
                    <p className="text-lg font-semibold text-success">{yieldVault.currentAPY.toFixed(2)}%</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Assets</span>
                    <span className="font-semibold text-crypto-cyan">{parseFloat(yieldVault.totalAssets).toFixed(4)} ETH</span>
                  </div>
                  <Progress value={Math.min(yieldVault.currentAPY, 100)} className="h-2" />
                </div>

                {/* Deposit */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Deposit ETH</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={yieldDepositAmount}
                      onChange={(e) => setYieldDepositAmount(e.target.value)}
                      disabled={!isConnected || isPending}
                    />
                    <Button 
                      onClick={handleYieldDeposit}
                      disabled={!isConnected || isPending}
                      className="gradient-accent text-accent-foreground"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Withdraw */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Withdraw Shares</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={yieldWithdrawAmount}
                      onChange={(e) => setYieldWithdrawAmount(e.target.value)}
                      disabled={!isConnected || isPending}
                    />
                    <Button 
                      variant="outline"
                      onClick={handleYieldWithdraw}
                      disabled={!isConnected || isPending}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={handleHarvest}
                  disabled={!isConnected || isPending}
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                  Harvest Yield
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Contract: {contracts.yieldVault.slice(0, 10)}...{contracts.yieldVault.slice(-8)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
