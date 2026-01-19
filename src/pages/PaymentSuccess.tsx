import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      <Card className="w-full max-w-lg relative border-primary/20 shadow-xl shadow-primary/10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <Badge variant="outline" className="mx-auto mb-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Payment Successful
          </Badge>
          <CardTitle className="text-2xl">Thank You for Your Purchase!</CardTitle>
          <CardDescription>
            Your payment has been processed successfully.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Your credits or subscription has been activated and is ready to use.
            </p>
            {sessionId && (
              <p className="text-xs text-muted-foreground font-mono">
                Session: {sessionId.slice(0, 20)}...
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">✓</div>
              <p className="text-xs text-muted-foreground mt-1">Payment Received</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">✓</div>
              <p className="text-xs text-muted-foreground mt-1">Account Updated</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">✓</div>
              <p className="text-xs text-muted-foreground mt-1">Ready to Use</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>A confirmation email has been sent to your registered email address.</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link to="/">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Redirecting in {countdown} seconds...
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
