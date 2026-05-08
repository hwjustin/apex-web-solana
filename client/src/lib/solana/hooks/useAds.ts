/**
 * Ad + ProcessedAction hooks. Used by Publisher + Dashboard.
 */

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import { getReadonlyProgram } from "../program";

export interface AdRecord {
  pubkey: PublicKey;
  adId: BN;
  campaignId: BN;
  advertiserId: BN;
  publisherId: BN;
  startTime: BN;
  metadata: Buffer;
}

export interface ProcessedActionRecord {
  pubkey: PublicKey;
  campaignId: BN;
  publisherId: BN;
  validatorId: BN;
  actionHash: Uint8Array;
  paymentAmount: BN;
  processedAt: BN;
}

export function useAllAds() {
  return useQuery({
    queryKey: ["ads", "all"],
    queryFn: async () => {
      const program = getReadonlyProgram();
      const all = await (program.account as Record<string, { all: () => Promise<Array<{ publicKey: PublicKey; account: Record<string, unknown> }>> }>).adAccount.all();
      return all
        .map<AdRecord>((entry) => ({
          pubkey: entry.publicKey,
          adId: entry.account.adId as BN,
          campaignId: entry.account.campaignId as BN,
          advertiserId: entry.account.advertiserId as BN,
          publisherId: entry.account.publisherId as BN,
          startTime: entry.account.startTime as BN,
          metadata: Buffer.from(entry.account.metadata as Buffer | Uint8Array),
        }))
        .sort((a, b) => b.adId.cmp(a.adId));
    },
  });
}

export function useAllProcessedActions() {
  return useQuery({
    queryKey: ["processedActions", "all"],
    queryFn: async () => {
      const program = getReadonlyProgram();
      const all = await (program.account as Record<string, { all: () => Promise<Array<{ publicKey: PublicKey; account: Record<string, unknown> }>> }>).processedAction.all();
      return all
        .map<ProcessedActionRecord>((entry) => ({
          pubkey: entry.publicKey,
          campaignId: entry.account.campaignId as BN,
          publisherId: entry.account.publisherId as BN,
          validatorId: entry.account.validatorId as BN,
          actionHash: new Uint8Array(entry.account.actionHash as number[]),
          paymentAmount: entry.account.paymentAmount as BN,
          processedAt: entry.account.processedAt as BN,
        }))
        .sort((a, b) => b.processedAt.cmp(a.processedAt));
    },
  });
}
