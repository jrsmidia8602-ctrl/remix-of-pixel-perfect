import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Store, DollarSign, Activity, Copy, RefreshCw, Key, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  api_endpoint: string;
  price_per_call: number | null;
  total_calls: number | null;
  total_revenue: number | null;
  is_active: boolean | null;
  categories: string[] | null;
}

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean | null;
  total_executions: number | null;
  total_spent: number | null;
  created_at: string;
}

export function ApiMarketplace() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);

  const fetchData = async () => {
    try {
      const [productsRes, keysRes] = await Promise.all([
        supabase.from("api_products").select("*").order("total_revenue", { ascending: false }),
        supabase.from("api_keys").select("*").order("created_at", { ascending: false }),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (keysRes.error) throw keysRes.error;

      setProducts(productsRes.data || []);
      setApiKeys(keysRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch API data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleProductStatus = async (product: ApiProduct) => {
    try {
      const { error } = await supabase
        .from("api_products")
        .update({ is_active: !product.is_active })
        .eq("id", product.id);

      if (error) throw error;

      toast.success(`${product.name} ${!product.is_active ? "activated" : "deactivated"}`);
      fetchData();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const updatePrice = async (productId: string, price: number) => {
    try {
      const { error } = await supabase
        .from("api_products")
        .update({ price_per_call: price })
        .eq("id", productId);

      if (error) throw error;

      toast.success("Price updated");
      fetchData();
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Failed to update price");
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    setCreatingKey(true);
    try {
      // Generate a simple key (in production, use proper crypto)
      const keyValue = `xpex_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const keyPrefix = keyValue.substring(0, 12);

      // Simple hash simulation (in production, use proper hashing)
      const keyHash = btoa(keyValue);

      const { error } = await supabase.from("api_keys").insert({
        name: newKeyName,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        is_active: true,
        daily_budget: 100,
        rate_limit_per_minute: 60,
        rate_limit_per_hour: 1000,
      });

      if (error) throw error;

      toast.success("API Key created!", {
        description: `Key: ${keyValue} (save this, it won't be shown again)`,
        duration: 10000,
      });

      navigator.clipboard.writeText(keyValue);
      setNewKeyName("");
      fetchData();
    } catch (error) {
      console.error("Error creating key:", error);
      toast.error("Failed to create API key");
    } finally {
      setCreatingKey(false);
    }
  };

  const toggleKeyStatus = async (key: ApiKey) => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active: !key.is_active })
        .eq("id", key.id);

      if (error) throw error;

      toast.success(`API key ${!key.is_active ? "activated" : "revoked"}`);
      fetchData();
    } catch (error) {
      console.error("Error updating key:", error);
      toast.error("Failed to update key");
    }
  };

  const totalRevenue = products.reduce((acc, p) => acc + (p.total_revenue || 0), 0);
  const totalCalls = products.reduce((acc, p) => acc + (p.total_calls || 0), 0);
  const activeProducts = products.filter((p) => p.is_active).length;

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-crypto-cyan" />
              API Marketplace
            </CardTitle>
            <CardDescription>
              Manage API products and generate API keys for customers
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Key Name</Label>
                  <Input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production Key, Test Key"
                  />
                </div>
                <Button onClick={createApiKey} disabled={creatingKey} className="w-full">
                  {creatingKey ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Generate Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-crypto-cyan/10 border border-crypto-cyan/30">
            <p className="text-xs text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
          <div className="p-4 rounded-lg bg-success/10 border border-success/30">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">{activeProducts}</p>
          </div>
          <div className="p-4 rounded-lg bg-crypto-green/10 border border-crypto-green/30">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-crypto-green">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-lg bg-crypto-purple/10 border border-crypto-purple/30">
            <p className="text-xs text-muted-foreground">Total Calls</p>
            <p className="text-2xl font-bold text-crypto-purple">{totalCalls}</p>
          </div>
        </div>

        {/* API Products */}
        <div>
          <h4 className="text-sm font-semibold mb-3">API Products</h4>
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-4 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-semibold">{product.name}</h5>
                    <p className="text-xs text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={product.is_active || false}
                      onCheckedChange={() => toggleProductStatus(product)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Price per Call</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">$</span>
                      <Input
                        type="number"
                        value={product.price_per_call || 0}
                        onChange={(e) => updatePrice(product.id, parseFloat(e.target.value) || 0)}
                        className="h-8 w-24"
                        step="0.001"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Calls</p>
                    <p className="font-semibold">{product.total_calls || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="font-semibold text-crypto-green">
                      ${(product.total_revenue || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div>
          <h4 className="text-sm font-semibold mb-3">API Keys ({apiKeys.length})</h4>
          <div className="space-y-2">
            {apiKeys.slice(0, 5).map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.key_prefix}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {key.total_executions || 0} calls
                    </p>
                    <p className="text-xs text-crypto-green">
                      ${(key.total_spent || 0).toFixed(2)} spent
                    </p>
                  </div>
                  <Switch
                    checked={key.is_active || false}
                    onCheckedChange={() => toggleKeyStatus(key)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
