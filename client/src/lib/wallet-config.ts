/**
 * Re-exports of Solana network configuration.
 *
 * Kept under the same path as the original Reown/Wagmi setup so any imports
 * around the codebase that reach for `@/lib/wallet-config` continue to work.
 * The actual wallet provider/adapter wiring lives in
 * `@/contexts/WalletProvider`.
 */

export {
  SOLANA_NETWORK,
  SOLANA_RPC_URL,
  PROGRAM_ID,
  USDC_MINT,
  USDC_DECIMALS,
  WALLETCONNECT_PROJECT_ID,
  EXPLORER_BASE,
  explorerTxUrl,
  explorerAddressUrl,
} from "./solana/config";
