import { ReactNode, useState, useEffect, Component, ErrorInfo } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";

// Global error suppression for wallet errors - runs BEFORE any React code
if (typeof window !== "undefined") {
  // Suppress synchronous errors from wallet extensions
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const message = args.join(" ");
    if (
      message.includes("MetaMask") ||
      message.includes("wallet") ||
      message.includes("injected") ||
      message.includes("User rejected")
    ) {
      console.warn("[Wallet Error Suppressed]:", message);
      return;
    }
    originalError.apply(console, args);
  };

  // Suppress unhandled promise rejections from wallet extensions
  window.addEventListener(
    "unhandledrejection",
    (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason);
      if (
        errorMessage.includes("MetaMask") ||
        errorMessage.includes("wallet") ||
        errorMessage.includes("connect") ||
        errorMessage.includes("User rejected") ||
        errorMessage.includes("user rejected") ||
        errorMessage.includes("Already processing") ||
        errorMessage.includes("injected")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn("[Wallet Promise Rejected]:", errorMessage);
        return false;
      }
    },
    true // Use capture phase
  );

  // Also handle regular errors
  window.addEventListener(
    "error",
    (event: ErrorEvent) => {
      const errorMessage = event.message || "";
      if (
        errorMessage.includes("MetaMask") ||
        errorMessage.includes("wallet") ||
        errorMessage.includes("injected")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn("[Wallet Error Caught]:", errorMessage);
        return false;
      }
    },
    true
  );
}

interface Web3ProviderProps {
  children: ReactNode;
}

// Error Boundary specifically for Web3 errors
interface ErrorBoundaryState {
  hasError: boolean;
}

class Web3ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: false }; // Don't show error UI, just recover
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorMessage = error.message || "";
    if (
      errorMessage.includes("MetaMask") ||
      errorMessage.includes("wallet") ||
      errorMessage.includes("connect")
    ) {
      console.warn("[Web3ErrorBoundary] Wallet error caught:", errorMessage);
      // Reset state to allow app to continue
      this.setState({ hasError: false });
    } else {
      console.error("[Web3ErrorBoundary] Non-wallet error:", error, errorInfo);
    }
  }

  render() {
    return this.props.children;
  }
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay mounting to avoid SSR/hydration issues with wallet extensions
    setMounted(true);
  }, []);

  // Render children immediately but wrap wagmi in error boundary
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <Web3ErrorBoundary>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </Web3ErrorBoundary>
  );
}
