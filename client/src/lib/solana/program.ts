import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Keypair, type ConfirmOptions } from "@solana/web3.js";
import { IDL } from "../idl/apex_solana";
import { SOLANA_RPC_URL } from "./config";

export const CONFIRM_OPTS: ConfirmOptions = {
  preflightCommitment: "processed",
  commitment: "confirmed",
};

export function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, CONFIRM_OPTS.commitment);
}

/**
 * Build a read-only Anchor program (no signer required). Useful for queries
 * before the wallet is connected.
 */
export function getReadonlyProgram(): Program {
  const connection = getConnection();
  // A throwaway wallet that satisfies AnchorProvider but cannot sign.
  const dummy = Keypair.generate();
  const wallet = {
    publicKey: dummy.publicKey,
    signTransaction: async () => {
      throw new Error("readonly wallet");
    },
    signAllTransactions: async () => {
      throw new Error("readonly wallet");
    },
  };
  const provider = new AnchorProvider(connection, wallet as never, CONFIRM_OPTS);
  return new Program(IDL as unknown as Idl, provider);
}

/**
 * Build an Anchor program tied to the connected wallet. Returns null if the
 * wallet does not yet have a publicKey.
 */
export function getProgram(wallet: WalletContextState): Program | null {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    return null;
  }
  const connection = getConnection();
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction.bind(wallet),
      signAllTransactions: wallet.signAllTransactions.bind(wallet),
    },
    CONFIRM_OPTS,
  );
  return new Program(IDL as unknown as Idl, provider);
}
