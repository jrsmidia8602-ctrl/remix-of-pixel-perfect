import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, HelpCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentCanceled() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-muted/5" />
      
      <Card className="w-full max-w-lg relative border-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Payment Canceled</CardTitle>
          <CardDescription>
            Your payment was not completed. No charges have been made.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Don't worry – you can try again whenever you're ready. 
              Your cart and selections are still saved.
            </p>
          </div>

          <div className="space-y-2 text-left">
            <h3 className="font-medium flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              Common reasons for cancellation:
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Changed your mind about the purchase</li>
              <li>• Need to update payment information</li>
              <li>• Want to explore other options first</li>
              <li>• Technical difficulties with payment</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link to="/pricing">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
