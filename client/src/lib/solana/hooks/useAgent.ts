/**
 * Agent (identity) hooks. Mirror the EVM IdentityRegistry.
 *
 * Reads run via the read-only program; writes require a connected wallet.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import { Buffer } from "buffer";

import { getProgram, getReadonlyProgram } from "../program";
import {
  agentAddr,
  authorityIndexAddr,
  domainIndexAddr,
  stateAddr,
} from "../pdas";
import { domainHash } from "../utils";

export interface AgentRecord {
  pubkey: PublicKey;
  agentId: BN;
  agentDomain: string;
  authority: PublicKey;
}

function decodeAgent(pubkey: PublicKey, account: Record<string, unknown>): AgentRecord {
  return {
    pubkey,
    agentId: account.agentId as BN,
    agentDomain: account.agentDomain as string,
    authority: account.authority as PublicKey,
  };
}

/** Look up the agent registered to a given authority (wallet pubkey). */
export function useAgentByAuthority(
  authority: PublicKey | null,
  opts: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["agentByAuthority", authority?.toBase58() ?? null],
    enabled: !!authority && (opts.enabled ?? true),
    queryFn: async (): Promise<AgentRecord | null> => {
      if (!authority) return null;
      const program = getReadonlyProgram();
      try {
        const indexPda = authorityIndexAddr(authority);
        const idx = (await (program.account as Record<string, { fetchNullable: (k: PublicKey) => Promise<{ agentId: BN } | null> }>).authorityIndex.fetchNullable(indexPda));
        if (!idx) return null;
        const agentPda = agentAddr(idx.agentId);
        const account = await (program.account as Record<string, { fetchNullable: (k: PublicKey) => Promise<Record<string, unknown> | null> }>).agentInfo.fetchNullable(agentPda);
        return account ? decodeAgent(agentPda, account) : null;
      } catch (err) {
        console.error("[useAgentByAuthority]", err);
        return null;
      }
    },
  });
}

/** Read the global state singleton (campaign / agent / ad counters, fees). */
export function useGlobalState() {
  return useQuery({
    queryKey: ["globalState"],
    queryFn: async () => {
      const program = getReadonlyProgram();
      const acc = await (program.account as Record<string, { fetchNullable: (k: PublicKey) => Promise<Record<string, unknown> | null> }>).globalState.fetchNullable(stateAddr());
      return acc as null | {
        authority: PublicKey;
        registrationFeeLamports: BN;
        agentCount: BN;
        campaignCount: BN;
        adCount: BN;
      };
    },
  });
}

/** Register a new agent for the connected wallet. */
export function useRegisterAgent() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ domain }: { domain: string }) => {
      const program = getProgram(wallet);
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      const state = stateAddr();
      const stateAcc = await (program.account as Record<string, { fetch: (k: PublicKey) => Promise<{ agentCount: BN }> }>).globalState.fetch(state);
      const nextAgentId = stateAcc.agentCount.add(new BN(1));
      const hash = await domainHash(domain);

      const sig = await program.methods
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .newAgent(nextAgentId, domain, Buffer.from(hash) as any)
        .accounts({
          authority: wallet.publicKey,
          state,
          agent: agentAddr(nextAgentId),
          domainIndex: domainIndexAddr(hash),
          authorityIndex: authorityIndexAddr(wallet.publicKey),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(sig, "confirmed");
      return { signature: sig, agentId: nextAgentId };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["agentByAuthority"] });
      void qc.invalidateQueries({ queryKey: ["globalState"] });
    },
  });
}
