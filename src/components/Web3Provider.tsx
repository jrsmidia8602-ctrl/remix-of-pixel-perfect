import { ReactNode, useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // Create QueryClient inside component to avoid SSR/hydration issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }));

  // Handle unhandled promise rejections from wallet extensions (MetaMask, etc.)
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if this is a wallet connection error
      const errorMessage = event.reason?.message || String(event.reason);
      if (
        errorMessage.includes('MetaMask') ||
        errorMessage.includes('wallet') ||
        errorMessage.includes('connect') ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected')
      ) {
        // Prevent the error from appearing in console as unhandled
        event.preventDefault();
        console.warn('Wallet connection cancelled or failed:', errorMessage);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
