import { http, createConfig } from "wagmi";
import { base, mainnet, polygon } from "wagmi/chains";
import { injected, walletConnect } from "@wagmi/connectors";

// WalletConnect project ID - you can get one at https://cloud.walletconnect.com
// For development, we'll use a placeholder that works for testing
const projectId = "3fbb6bba6f1de962d911bb5b5c9dba88";

export const wagmiConfig = createConfig({
  chains: [base, mainnet, polygon],
  connectors: [
    injected(),
    walletConnect({ 
      projectId,
      metadata: {
        name: "XPEX Neural Supreme",
        description: "Multi-Chain Payment Processing Platform",
        url: typeof window !== "undefined" ? window.location.origin : "https://xpex.io",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
  },
});

export const supportedChains = [
  { id: base.id, name: "Base", icon: "🔵" },
  { id: mainnet.id, name: "Ethereum", icon: "⟠" },
  { id: polygon.id, name: "Polygon", icon: "🟣" },
];
