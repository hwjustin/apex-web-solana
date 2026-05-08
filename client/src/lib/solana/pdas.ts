/**
 * PDA seed helpers — must stay in lockstep with
 * `apex-contract-solana/solana/programs/apex-solana/src/constants.rs`.
 */

import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID } from "./config";

export const STATE_SEED = Buffer.from("state");
export const AGENT_SEED = Buffer.from("agent");
export const DOMAIN_SEED = Buffer.from("domain");
export const AUTHORITY_SEED = Buffer.from("authority");
export const FEEDBACK_SEED = Buffer.from("feedback");
export const VALIDATION_SEED = Buffer.from("validation");
export const CAMPAIGN_SEED = Buffer.from("campaign");
export const CAMPAIGN_VAULT_SEED = Buffer.from("campaign-vault");
export const PROCESSED_ACTION_SEED = Buffer.from("processed-action");
export const AD_SEED = Buffer.from("ad");

const u64 = (n: number | bigint | BN): Buffer => {
  const bn = BN.isBN(n) ? n : new BN(typeof n === "bigint" ? n.toString() : n);
  return bn.toArrayLike(Buffer, "le", 8);
};

export const stateAddr = () => PublicKey.findProgramAddressSync([STATE_SEED], PROGRAM_ID)[0];

export const agentAddr = (agentId: number | bigint | BN) =>
  PublicKey.findProgramAddressSync([AGENT_SEED, u64(agentId)], PROGRAM_ID)[0];

export const domainIndexAddr = (domainHash: Uint8Array) =>
  PublicKey.findProgramAddressSync([DOMAIN_SEED, Buffer.from(domainHash)], PROGRAM_ID)[0];

export const authorityIndexAddr = (authority: PublicKey) =>
  PublicKey.findProgramAddressSync([AUTHORITY_SEED, authority.toBuffer()], PROGRAM_ID)[0];

export const feedbackAddr = (clientId: number | bigint | BN, serverId: number | bigint | BN) =>
  PublicKey.findProgramAddressSync(
    [FEEDBACK_SEED, u64(clientId), u64(serverId)],
    PROGRAM_ID,
  )[0];

export const validationAddr = (dataHash: Uint8Array) =>
  PublicKey.findProgramAddressSync([VALIDATION_SEED, Buffer.from(dataHash)], PROGRAM_ID)[0];

export const campaignAddr = (campaignId: number | bigint | BN) =>
  PublicKey.findProgramAddressSync([CAMPAIGN_SEED, u64(campaignId)], PROGRAM_ID)[0];

export const campaignVaultAddr = (campaignId: number | bigint | BN) =>
  PublicKey.findProgramAddressSync(
    [CAMPAIGN_VAULT_SEED, u64(campaignId)],
    PROGRAM_ID,
  )[0];

export const processedActionAddr = (campaignId: number | bigint | BN, actionHash: Uint8Array) =>
  PublicKey.findProgramAddressSync(
    [PROCESSED_ACTION_SEED, u64(campaignId), Buffer.from(actionHash)],
    PROGRAM_ID,
  )[0];

export const adAddr = (adId: number | bigint | BN) =>
  PublicKey.findProgramAddressSync([AD_SEED, u64(adId)], PROGRAM_ID)[0];
