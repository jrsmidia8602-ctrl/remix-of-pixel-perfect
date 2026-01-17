import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Play, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CronJob {
  name: string;
  endpoint: string;
  schedule: string;
  payload: Record<string, string>;
  status: "active" | "inactive" | "error";
  lastRun?: string;
}

const CRON_JOBS: CronJob[] = [
  {
    name: "Agent Scheduler",
    endpoint: "https://ggzdhmltktbcpuwgvljn.supabase.co/functions/v1/agent-scheduler",
    schedule: "*/5 * * * *",
    payload: { action: "run_scheduled_cycle" },
    status: "inactive",
  },
  {
    name: "Neural Brain Cycle",
    endpoint: "https://ggzdhmltktbcpuwgvljn.supabase.co/functions/v1/neural-brain",
    schedule: "*/10 * * * *",
    payload: { action: "process_cycle" },
    status: "inactive",
  },
  {
    name: "System Audit",
    endpoint: "https://ggzdhmltktbcpuwgvljn.supabase.co/functions/v1/system-audit",
    schedule: "0 * * * *",
    payload: {},
    status: "inactive",
  },
];

export function CronConfigurator() {
  const [jobs, setJobs] = useState<CronJob[]>(CRON_JOBS);
  const [testing, setTesting] = useState<string | null>(null);

  const testEndpoint = async (job: CronJob) => {
    setTesting(job.name);
    try {
      const functionName = job.endpoint.split("/functions/v1/")[1];
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: job.payload,
      });

      if (error) throw error;

      toast.success(`${job.name} executed successfully`, {
        description: `Response: ${JSON.stringify(data).substring(0, 100)}...`,
      });

      setJobs(prev =>
        prev.map(j =>
          j.name === job.name
            ? { ...j, status: "active", lastRun: new Date().toISOString() }
            : j
        )
      );
    } catch (error) {
      console.error("Test error:", error);
      toast.error(`${job.name} failed`, {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setJobs(prev =>
        prev.map(j => (j.name === job.name ? { ...j, status: "error" } : j))
      );
    } finally {
      setTesting(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (status: CronJob["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success border-success/30"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending Config</Badge>;
    }
  };

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-crypto-purple" />
          CRON Configuration
        </CardTitle>
        <CardDescription>
          Configure external CRON jobs to run agents automatically 24/7
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Setup Instructions */}
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
          <h4 className="font-semibold text-warning mb-2">⚠️ Critical Setup Required</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Configure these CRON jobs on <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">cron-job.org</a> (free) to enable 24/7 automation:
          </p>
          <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
            <li>Create free account at cron-job.org</li>
            <li>Add each endpoint below as a new CRON job</li>
            <li>Set method to POST with JSON body</li>
            <li>Test each endpoint using the Test button</li>
          </ol>
        </div>

        {/* CRON Jobs List */}
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.name} className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold">{job.name}</h4>
                  {getStatusBadge(job.status)}
                </div>
                <Button
                  size="sm"
                  onClick={() => testEndpoint(job)}
                  disabled={testing === job.name}
                >
                  {testing === job.name ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span className="ml-2">Test</span>
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Endpoint URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={job.endpoint}
                      readOnly
                      className="font-mono text-xs bg-background"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(job.endpoint)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Schedule</Label>
                    <Input
                      value={job.schedule}
                      readOnly
                      className="font-mono text-xs bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">JSON Payload</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={JSON.stringify(job.payload)}
                        readOnly
                        className="font-mono text-xs bg-background"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(JSON.stringify(job.payload))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {job.lastRun && (
                  <p className="text-xs text-muted-foreground">
                    Last run: {new Date(job.lastRun).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full" asChild>
          <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open cron-job.org to Configure
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
