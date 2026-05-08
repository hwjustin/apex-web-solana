/**
 * Solana network configuration for APEX.
 *
 * Override any of these via Vite env vars (`VITE_*`) at build time.
 * - `VITE_SOLANA_NETWORK`: 'devnet' | 'mainnet-beta'
 * - `VITE_SOLANA_RPC_URL`: custom RPC endpoint (Helius, QuickNode, …)
 * - `VITE_PROGRAM_ID`: deployed apex-solana program id
 * - `VITE_USDC_MINT`: SPL mint used as the campaign budget token
 * - `VITE_WALLETCONNECT_PROJECT_ID`: projectId from cloud.walletconnect.com
 */

import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import type { Cluster } from "@solana/web3.js";

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;

export const SOLANA_NETWORK: Cluster =
  ((env?.VITE_SOLANA_NETWORK as Cluster) ?? "devnet");

export const SOLANA_RPC_URL: string =
  env?.VITE_SOLANA_RPC_URL ?? clusterApiUrl(SOLANA_NETWORK);

// Default program id — override via VITE_PROGRAM_ID once deployed.
// This is the placeholder declared in apex-contract-solana/solana/Anchor.toml.
export const PROGRAM_ID = new PublicKey(
  env?.VITE_PROGRAM_ID ?? "3YKNvs1ZizwFzbraboHsxAeLSoKx4UFDwxkuNXqMkEX5",
);

// USDC SPL mints. Devnet uses a Circle-issued faucet mint.
export const USDC_MINT = new PublicKey(
  env?.VITE_USDC_MINT ??
    (SOLANA_NETWORK === "mainnet-beta"
      ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      : "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
);

export const USDC_DECIMALS = 6;

export const WALLETCONNECT_PROJECT_ID: string =
  env?.VITE_WALLETCONNECT_PROJECT_ID ?? "60afa7e692e94972d30babecedbd7c1f";

export const EXPLORER_BASE = "https://explorer.solana.com";

export function explorerTxUrl(signature: string): string {
  const cluster = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `${EXPLORER_BASE}/tx/${signature}${cluster}`;
}

export function explorerAddressUrl(address: string): string {
  const cluster = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `${EXPLORER_BASE}/address/${address}${cluster}`;
}
