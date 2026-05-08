import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { USDC_DECIMALS } from "./config";

async function sha256Bytes(input: Uint8Array): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest("SHA-256", input);
  return new Uint8Array(buf);
}

// Solana's `solana_program::hash::hash` is SHA-256.
export async function domainHash(domain: string): Promise<Uint8Array> {
  return sha256Bytes(new TextEncoder().encode(domain));
}

export async function actionHash(input: string | Uint8Array): Promise<Uint8Array> {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return sha256Bytes(bytes);
}

export function truncateBase58(key: PublicKey | string, length = 4): string {
  const s = typeof key === "string" ? key : key.toBase58();
  if (s.length <= length * 2 + 1) return s;
  return `${s.slice(0, length)}…${s.slice(-length)}`;
}

export function formatUsdc(raw: BN | bigint | number, decimals = USDC_DECIMALS): string {
  const bn = BN.isBN(raw)
    ? raw
    : new BN(typeof raw === "bigint" ? raw.toString() : Math.floor(raw));
  const divisor = new BN(10).pow(new BN(decimals));
  const whole = bn.div(divisor).toString();
  const frac = bn.mod(divisor).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac.length ? `${whole}.${frac}` : whole;
}

export function parseUsdc(value: string, decimals = USDC_DECIMALS): BN {
  const trimmed = value.trim();
  if (!trimmed) return new BN(0);
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return new BN(whole || "0").mul(new BN(10).pow(new BN(decimals))).add(new BN(fracPadded || "0"));
}
