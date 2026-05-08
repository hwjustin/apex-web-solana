/**
 * WalletProvider — Solana wallet adapter + React Query stack.
 *
 * Wraps the app with:
 *   1. ConnectionProvider — supplies the Solana RPC connection
 *   2. SolanaWalletProvider — manages wallet state (Phantom, Solflare, …)
 *   3. WalletModalProvider — renders the connect modal UI
 *   4. QueryClientProvider — TanStack Query for derived async state
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
  WalletConnectWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ReactNode, useMemo } from "react";

import { SOLANA_NETWORK, SOLANA_RPC_URL, WALLETCONNECT_PROJECT_ID } from "@/lib/solana/config";

import "@solana/wallet-adapter-react-ui/styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const network: WalletAdapterNetwork.Mainnet | WalletAdapterNetwork.Devnet =
    SOLANA_NETWORK === "mainnet-beta"
      ? WalletAdapterNetwork.Mainnet
      : WalletAdapterNetwork.Devnet;

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new LedgerWalletAdapter(),
      new WalletConnectWalletAdapter({
        network,
        options: {
          projectId: WALLETCONNECT_PROJECT_ID,
          metadata: {
            name: "APEX",
            description: "AI-Native Ad Infrastructure on Solana",
            url: typeof window !== "undefined" ? window.location.origin : "https://solana.apex.network",
            icons: ["/apex_x_logo.png"],
          },
        },
      }),
    ],
    [network],
  );

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
