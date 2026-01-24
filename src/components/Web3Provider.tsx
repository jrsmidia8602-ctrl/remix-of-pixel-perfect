import { ReactNode, useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";

interface Web3ProviderProps {
  children: ReactNode;
}

// Install global error handler IMMEDIATELY (before React renders)
if (typeof window !== "undefined") {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const errorMessage = event.reason?.message || String(event.reason);
    if (
      errorMessage.includes('MetaMask') ||
      errorMessage.includes('wallet') ||
      errorMessage.includes('connect') ||
      errorMessage.includes('User rejected') ||
      errorMessage.includes('user rejected') ||
      errorMessage.includes('Already processing')
    ) {
      event.preventDefault();
      console.warn('Wallet connection cancelled or failed:', errorMessage);
    }
  });
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 1,
      },
    },
  }));

  // Additional cleanup handler in useEffect for React lifecycle
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason);
      if (
        errorMessage.includes('MetaMask') ||
        errorMessage.includes('wallet') ||
        errorMessage.includes('connect') ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected')
      ) {
        event.preventDefault();
        console.warn('Wallet error intercepted:', errorMessage);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
