import { http, createConfig, createStorage } from "wagmi";
import { base, mainnet, polygon } from "wagmi/chains";
import { injected, walletConnect } from "@wagmi/connectors";

// WalletConnect project ID - you can get one at https://cloud.walletconnect.com
const projectId = "3fbb6bba6f1de962d911bb5b5c9dba88";

// Create a custom storage that handles errors gracefully
const storage = createStorage({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: "xpex-wagmi",
});

export const wagmiConfig = createConfig({
  chains: [base, mainnet, polygon],
  connectors: [
    injected({
      shimDisconnect: true, // Helps prevent auto-connect issues
    }),
    walletConnect({ 
      projectId,
      metadata: {
        name: "XPEX Neural Supreme",
        description: "Multi-Chain Payment Processing Platform",
        url: typeof window !== "undefined" ? window.location.origin : "https://xpex.io",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
      },
      showQrModal: true,
    }),
  ],
  storage,
  // Disable auto-connect to prevent MetaMask errors on page load
  syncConnectedChain: true,
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
