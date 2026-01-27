import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentEconomy } from "@/hooks/useAgentEconomy";
import { useAuth } from "@/hooks/useAuth";
import { 
  Bot, Zap, CreditCard, Wallet, Search, Star, TrendingUp, 
  Play, ShoppingCart, Sparkles, ArrowRight, Clock, CheckCircle,
  Package, Activity
} from "lucide-react";

export default function Marketplace() {
  const { user } = useAuth();
  const { 
    wallet, 
    marketplaceAgents, 
    creditPacks, 
    loading, 
    executeAgent,
    purchaseCredits 
  } = useAgentEconomy(user?.id);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [executingAgent, setExecutingAgent] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All", icon: Bot },
    { id: "data", label: "Data", icon: Activity },
    { id: "payment", label: "Payments", icon: CreditCard },
    { id: "automation", label: "Automation", icon: Zap },
    { id: "blockchain", label: "Blockchain", icon: Package },
  ];

  const filteredAgents = marketplaceAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExecuteAgent = async (agentId: string) => {
    setExecutingAgent(agentId);
    await executeAgent(agentId);
    setExecutingAgent(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "data": return <Activity className="h-4 w-4" />;
      case "payment": return <CreditCard className="h-4 w-4" />;
      case "automation": return <Zap className="h-4 w-4" />;
      case "blockchain": return <Package className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agent Marketplace</h1>
            <p className="text-muted-foreground">
              Execute autonomous agents and pay only for what you use
            </p>
          </div>
          
          {/* Wallet Summary */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold">{wallet?.balance_credits.toFixed(2) || "0.00"}</p>
                <p className="text-xs text-muted-foreground">credits</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="ml-4">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Buy
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Buy Credits</DialogTitle>
                    <DialogDescription>
                      Choose a credit pack to execute agents
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {creditPacks.map((pack) => (
                      <Card 
                        key={pack.id}
                        className={`relative ${pack.is_featured ? 'border-primary shadow-lg' : ''}`}
                      >
                        {pack.is_featured && (
                          <Badge className="absolute -top-2 -right-2 bg-primary">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle>{pack.name}</CardTitle>
                          <CardDescription>{pack.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">${pack.price_usd}</span>
                            <span className="text-muted-foreground">USD</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-primary" />
                              <span>{pack.credits_amount} credits</span>
                            </div>
                            {pack.bonus_credits > 0 && (
                              <div className="flex items-center gap-2 text-primary">
                                <Sparkles className="h-4 w-4" />
                                <span>+{pack.bonus_credits} bonus</span>
                              </div>
                            )}
                          </div>
                          <Button 
                            className="w-full" 
                            variant={pack.is_featured ? "default" : "outline"}
                            onClick={() => purchaseCredits(pack.id)}
                          >
                            Buy
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agents">
              <Bot className="h-4 w-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="whitespace-nowrap"
                  >
                    <cat.icon className="h-4 w-4 mr-1" />
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Agents Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAgents.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No agents found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search term
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map((agent) => (
                  <Card 
                    key={agent.id}
                    className={`transition-all hover:shadow-md ${agent.is_featured ? 'border-primary/50' : ''}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {getCategoryIcon(agent.category)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{agent.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {agent.category}
                              </Badge>
                              {agent.is_featured && (
                                <Badge className="text-xs bg-yellow-500">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {agent.short_description || agent.description}
                      </p>
                      
                      {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Play className="h-3 w-3" />
                            <span>{agent.execution_count} executions</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            <span>${agent.total_revenue.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Rating */}
                      {agent.rating_count > 0 && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`h-4 w-4 ${star <= agent.rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`}
                            />
                          ))}
                          <span className="text-sm text-muted-foreground ml-1">
                            ({agent.rating_count})
                          </span>
                        </div>
                      )}

                      {/* Price and Execute */}
                      <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <span className="text-xl font-bold">{agent.price_per_execution}</span>
                            <span className="text-sm text-muted-foreground"> credits/exec</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleExecuteAgent(agent.agent_id)}
                          disabled={executingAgent === agent.agent_id || !wallet || wallet.balance_credits < agent.price_per_execution}
                        >
                          {executingAgent === agent.agent_id ? (
                            <>
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Executando...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Executar
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Your latest credit transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Feature in development...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
