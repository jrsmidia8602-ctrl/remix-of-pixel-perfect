import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Radar, Plus, Loader2 } from "lucide-react";

interface SignalScannerProps {
  onAddSignal: (data: {
    keyword: string;
    signal_text?: string;
    source?: string;
    signal_volume?: number;
    velocity_score?: number;
  }) => Promise<void>;
}

const sources = [
  { value: "manual_input", label: "Manual Input" },
  { value: "google_trends", label: "Google Trends" },
  { value: "twitter", label: "X (Twitter)" },
  { value: "reddit", label: "Reddit" },
  { value: "freelance_marketplace", label: "Freelance Marketplace" },
];

export function SignalScanner({ onAddSignal }: SignalScannerProps) {
  const [keyword, setKeyword] = useState("");
  const [signalText, setSignalText] = useState("");
  const [source, setSource] = useState("manual_input");
  const [volume, setVolume] = useState([100]);
  const [velocity, setVelocity] = useState([1.5]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    await onAddSignal({
      keyword: keyword.trim(),
      signal_text: signalText.trim() || undefined,
      source,
      signal_volume: volume[0],
      velocity_score: velocity[0],
    });
    setLoading(false);

    // Reset form
    setKeyword("");
    setSignalText("");
    setVolume([100]);
    setVelocity([1.5]);
  };

  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Radar className="h-5 w-5 text-primary" />
          Add Demand Signal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword / Topic *</Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g., AI chatbot API"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signalText">Signal Description</Label>
            <Textarea
              id="signalText"
              value={signalText}
              onChange={(e) => setSignalText(e.target.value)}
              placeholder="Describe the demand signal or paste the source text..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Signal Volume</Label>
                <span className="text-sm text-muted-foreground">{volume[0]}</span>
              </div>
              <Slider
                value={volume}
                onValueChange={setVolume}
                min={10}
                max={500}
                step={10}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Velocity Score</Label>
                <span className="text-sm text-muted-foreground">{velocity[0].toFixed(1)}x</span>
              </div>
              <Slider
                value={velocity}
                onValueChange={setVelocity}
                min={0.5}
                max={5}
                step={0.1}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !keyword.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Signal
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
