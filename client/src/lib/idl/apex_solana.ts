/**
 * Anchor IDL for the apex_solana program.
 *
 * This file is the typed view used by `@coral-xyz/anchor`. After running
 * `anchor build` in `apex-contract-solana/solana/`, replace the contents of
 * `apex_solana.json` (and re-export here) with the canonical IDL emitted to
 * `target/idl/apex_solana.json` / `target/types/apex_solana.ts`.
 *
 * The shape below mirrors `programs/apex-solana/src/lib.rs` 1:1 and is good
 * enough to build the frontend against. It is intentionally minimal — it
 * declares every instruction + account so `anchor.Program<ApexSolana>` is
 * usable.
 */

export type ApexSolana = {
  version: "0.1.0";
  name: "apex_solana";
  instructions: Array<{
    name: string;
    accounts: Array<{ name: string; isMut: boolean; isSigner: boolean }>;
    args: Array<{ name: string; type: unknown }>;
  }>;
  accounts: Array<{ name: string; type: { kind: "struct"; fields: Array<{ name: string; type: unknown }> } }>;
  errors: Array<{ code: number; name: string; msg: string }>;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
import idlJson from "./apex_solana.json";

export const IDL: ApexSolana = idlJson as unknown as ApexSolana;
