import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DemandSignal {
  id: string;
  source: string;
  keyword: string;
  signal_text: string | null;
  signal_volume: number;
  velocity_score: number;
  detected_at: string;
  created_at: string;
}

export interface DemandOpportunity {
  id: string;
  signal_id: string | null;
  demand_score: number;
  temperature: string;
  title: string;
  description: string | null;
  keywords: string[] | null;
  estimated_ticket: number;
  urgency_score: number;
  recommended_service: string | null;
  suggested_price: number | null;
  estimated_delivery_days: number | null;
  status: string;
  created_at: string;
  demand_signals?: DemandSignal;
}

export interface ServiceOffer {
  id: string;
  demand_opportunity_id: string;
  offer_type: string;
  title: string;
  description: string | null;
  price: number;
  delivery_days: number;
  copy_template: string | null;
  status: string;
  views_count: number;
  conversions_count: number;
  created_at: string;
}

export interface RadarStats {
  totalSignals: number;
  totalOpportunities: number;
  hotOpportunities: number;
  warmOpportunities: number;
  coldOpportunities: number;
  totalPotentialRevenue: number;
  avgDemandScore: number;
}

export function useDemandRadar() {
  const [signals, setSignals] = useState<DemandSignal[]>([]);
  const [opportunities, setOpportunities] = useState<DemandOpportunity[]>([]);
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchSignals = useCallback(async () => {
    const { data, error } = await supabase
      .from("demand_signals")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching signals:", error);
      return;
    }

    setSignals(data || []);
  }, []);

  const fetchOpportunities = useCallback(async () => {
    const { data, error } = await supabase
      .from("demand_opportunities")
      .select("*, demand_signals(*)")
      .order("demand_score", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching opportunities:", error);
      return;
    }

    setOpportunities(data || []);
  }, []);

  const fetchOffers = useCallback(async () => {
    const { data, error } = await supabase
      .from("service_offers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching offers:", error);
      return;
    }

    setOffers(data || []);
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSignals(), fetchOpportunities(), fetchOffers()]);
    setLoading(false);
  }, [fetchSignals, fetchOpportunities, fetchOffers]);

  // Add manual signal
  const addSignal = async (data: {
    keyword: string;
    signal_text?: string;
    source?: string;
    signal_volume?: number;
    velocity_score?: number;
  }) => {
    try {
      const { error } = await supabase.functions.invoke("demand-radar", {
        body: { ...data },
        method: "POST",
      });

      // Fallback to direct insert if function not available
      if (error) {
        // Validate source value
        const validSources = ['google_trends', 'twitter', 'reddit', 'freelance_marketplace', 'manual_input'] as const;
        const sourceValue = data.source && validSources.includes(data.source as typeof validSources[number])
          ? (data.source as typeof validSources[number])
          : 'manual_input';

        const { error: insertError } = await supabase
          .from("demand_signals")
          .insert({
            source: sourceValue,
            keyword: data.keyword,
            signal_text: data.signal_text || "",
            signal_volume: data.signal_volume || 50,
            velocity_score: data.velocity_score || 1,
          });

        if (insertError) throw insertError;
      }

      toast.success("Signal added successfully");
      await refetch();
    } catch (error) {
      console.error("Error adding signal:", error);
      toast.error("Failed to add signal");
    }
  };

  // Process signals through pipeline
  const processSignals = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("demand-radar/process", {
        method: "POST",
      });

      if (error) throw error;

      toast.success(`Processed ${data?.processed || 0} signals`);
      await refetch();
    } catch (error) {
      console.error("Error processing signals:", error);
      toast.error("Failed to process signals");
    } finally {
      setProcessing(false);
    }
  };

  // Generate offer for opportunity
  const generateOffer = async (opportunityId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("demand-radar/generate-offer", {
        body: { opportunity_id: opportunityId },
        method: "POST",
      });

      if (error) throw error;

      toast.success("Offer generated successfully");
      await refetch();
      return data?.offer;
    } catch (error) {
      console.error("Error generating offer:", error);
      toast.error("Failed to generate offer");
      return null;
    }
  };

  // Calculate stats
  const stats: RadarStats = {
    totalSignals: signals.length,
    totalOpportunities: opportunities.length,
    hotOpportunities: opportunities.filter((o) => o.temperature === "hot").length,
    warmOpportunities: opportunities.filter((o) => o.temperature === "warm").length,
    coldOpportunities: opportunities.filter((o) => o.temperature === "cold").length,
    totalPotentialRevenue: opportunities.reduce((sum, o) => sum + (o.estimated_ticket || 0), 0),
    avgDemandScore:
      opportunities.length > 0
        ? Math.round(
            (opportunities.reduce((sum, o) => sum + o.demand_score, 0) / opportunities.length) * 10
          ) / 10
        : 0,
  };

  // Initial load
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Real-time subscriptions
  useEffect(() => {
    const signalsChannel = supabase
      .channel("demand_signals_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "demand_signals" },
        () => fetchSignals()
      )
      .subscribe();

    const opportunitiesChannel = supabase
      .channel("demand_opportunities_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "demand_opportunities" },
        () => fetchOpportunities()
      )
      .subscribe();

    const offersChannel = supabase
      .channel("service_offers_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_offers" },
        () => fetchOffers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(signalsChannel);
      supabase.removeChannel(opportunitiesChannel);
      supabase.removeChannel(offersChannel);
    };
  }, [fetchSignals, fetchOpportunities, fetchOffers]);

  return {
    signals,
    opportunities,
    offers,
    stats,
    loading,
    processing,
    addSignal,
    processSignals,
    generateOffer,
    refetch,
  };
}
