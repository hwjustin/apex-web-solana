/**
 * Campaign hooks — CampaignRegistry equivalent on Solana.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { Buffer } from "buffer";

import { getProgram, getReadonlyProgram } from "../program";
import {
  agentAddr,
  campaignAddr,
  campaignVaultAddr,
  processedActionAddr,
  stateAddr,
} from "../pdas";
import { USDC_MINT } from "../config";

export interface CampaignRecord {
  pubkey: PublicKey;
  campaignId: BN;
  advertiserId: BN;
  authority: PublicKey;
  budgetAmount: BN;
  spentAmount: BN;
  cpaAmount: BN;
  budgetMint: PublicKey;
  startTime: BN;
  expiryTime: BN;
  spec: Buffer;
}

function decodeCampaign(pubkey: PublicKey, raw: Record<string, unknown>): CampaignRecord {
  return {
    pubkey,
    campaignId: raw.campaignId as BN,
    advertiserId: raw.advertiserId as BN,
    authority: raw.authority as PublicKey,
    budgetAmount: raw.budgetAmount as BN,
    spentAmount: raw.spentAmount as BN,
    cpaAmount: raw.cpaAmount as BN,
    budgetMint: raw.budgetMint as PublicKey,
    startTime: raw.startTime as BN,
    expiryTime: raw.expiryTime as BN,
    spec: Buffer.from(raw.spec as Buffer | Uint8Array),
  };
}

/** All campaigns. Used by Dashboard / discovery views. */
export function useAllCampaigns() {
  return useQuery({
    queryKey: ["campaigns", "all"],
    queryFn: async () => {
      const program = getReadonlyProgram();
      const all = await (program.account as Record<string, { all: () => Promise<Array<{ publicKey: PublicKey; account: Record<string, unknown> }>> }>).campaignAccount.all();
      return all
        .map((entry) => decodeCampaign(entry.publicKey, entry.account))
        .sort((a, b) => b.campaignId.cmp(a.campaignId));
    },
  });
}

/** Campaigns owned by a specific authority (wallet). */
export function useCampaignsByAdvertiser(authority: PublicKey | null) {
  return useQuery({
    queryKey: ["campaigns", "byAuthority", authority?.toBase58() ?? null],
    enabled: !!authority,
    queryFn: async () => {
      if (!authority) return [];
      const program = getReadonlyProgram();
      // Use a memcmp filter on the `authority` field.
      // Layout offset: 8 (discriminator) + 8 (campaignId) + 8 (advertiserId) = 24 bytes.
      const all = await (program.account as Record<string, { all: (filters?: Array<{ memcmp: { offset: number; bytes: string } }>) => Promise<Array<{ publicKey: PublicKey; account: Record<string, unknown> }>> }>).campaignAccount.all([
        { memcmp: { offset: 24, bytes: authority.toBase58() } },
      ]);
      return all
        .map((entry) => decodeCampaign(entry.publicKey, entry.account))
        .sort((a, b) => b.campaignId.cmp(a.campaignId));
    },
  });
}

/** Create a new campaign — escrows `budgetAmount` USDC into the vault PDA. */
export function useCreateCampaign() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      advertiserId: BN;
      budgetAmount: BN;
      cpaAmount: BN;
      startTime: BN;
      expiryTime: BN;
      spec: Buffer;
      mint?: PublicKey;
    }) => {
      const program = getProgram(wallet);
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
      const mint = args.mint ?? USDC_MINT;

      const state = stateAddr();
      const stateAcc = await (program.account as Record<string, { fetch: (k: PublicKey) => Promise<{ campaignCount: BN }> }>).globalState.fetch(state);
      const nextCampaignId = stateAcc.campaignCount.add(new BN(1));

      const advertiserAta = await getAssociatedTokenAddress(mint, wallet.publicKey);

      // Create the ATA if missing.
      const ataInfo = await connection.getAccountInfo(advertiserAta);
      const preInstructions = ataInfo
        ? []
        : [
            createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              advertiserAta,
              wallet.publicKey,
              mint,
            ),
          ];

      const sig = await program.methods
        .createCampaign(
          nextCampaignId,
          args.advertiserId,
          args.budgetAmount,
          args.cpaAmount,
          args.startTime,
          args.expiryTime,
          args.spec,
        )
        .accounts({
          advertiser: wallet.publicKey,
          state,
          advertiserAgent: agentAddr(args.advertiserId),
          budgetMint: mint,
          advertiserTokenAccount: advertiserAta,
          campaign: campaignAddr(nextCampaignId),
          campaignVault: campaignVaultAddr(nextCampaignId),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .preInstructions(preInstructions)
        .rpc();

      await connection.confirmTransaction(sig, "confirmed");
      return { signature: sig, campaignId: nextCampaignId };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
      void qc.invalidateQueries({ queryKey: ["globalState"] });
    },
  });
}

/** Withdraw any unspent budget after a campaign expires. */
export function useWithdrawRemaining() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, mint }: { campaignId: BN; mint?: PublicKey }) => {
      const program = getProgram(wallet);
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
      const m = mint ?? USDC_MINT;
      const ata = await getAssociatedTokenAddress(m, wallet.publicKey);

      // Ensure ATA exists.
      const info = await connection.getAccountInfo(ata);
      const tx = new Transaction();
      if (!info) {
        tx.add(
          createAssociatedTokenAccountInstruction(wallet.publicKey, ata, wallet.publicKey, m),
        );
      }

      const sig = await program.methods
        .withdrawRemainingBudget(campaignId)
        .accounts({
          advertiser: wallet.publicKey,
          campaign: campaignAddr(campaignId),
          campaignVault: campaignVaultAddr(campaignId),
          advertiserTokenAccount: ata,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(tx.instructions)
        .rpc();

      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

/** Validator-side: pay a publisher for a verified action. */
export function useProcessAction() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      campaignId: BN;
      publisherId: BN;
      validatorId: BN;
      actionHash: Uint8Array;
      publisherAuthority: PublicKey;
      mint?: PublicKey;
    }) => {
      const program = getProgram(wallet);
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
      const m = args.mint ?? USDC_MINT;

      const publisherAta = await getAssociatedTokenAddress(m, args.publisherAuthority);

      const sig = await program.methods
        .processAction(
          args.campaignId,
          args.publisherId,
          args.validatorId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Buffer.from(args.actionHash) as any,
        )
        .accounts({
          validator: wallet.publicKey,
          campaign: campaignAddr(args.campaignId),
          campaignVault: campaignVaultAddr(args.campaignId),
          publisherAgent: agentAddr(args.publisherId),
          validatorAgent: agentAddr(args.validatorId),
          publisherTokenAccount: publisherAta,
          processedAction: processedActionAddr(args.campaignId, args.actionHash),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
      void qc.invalidateQueries({ queryKey: ["processedActions"] });
    },
  });
}

// Silence unused imports (kept for future hooks that may need them).
void ASSOCIATED_TOKEN_PROGRAM_ID;
