# apex-web-solana

Solana edition of the APEX frontend. Talks to the `apex-solana` Anchor program in
[`apex-contract-solana/`](../apex-contract-solana/).

## Routes

| Path         | Purpose                                                           |
| ------------ | ----------------------------------------------------------------- |
| `/`          | Home / marketing page (with Solana network badge)                 |
| `/campaign`  | Advertiser dashboard — register agent, create / view campaigns    |
| `/demo`      | Gemini-backed chat agent with live campaign context               |
| `/publisher` | Per-wallet earnings + verified-action history                     |
| `/dashboard` | Protocol-wide analytics (counts, spend, recent payouts)           |

## Stack

- Vite + React 19 + TypeScript
- Tailwind 4 + shadcn primitives + Framer Motion
- `@solana/wallet-adapter-react` (+ Phantom, Solflare, Ledger, WalletConnect)
- `@coral-xyz/anchor` for typed program calls
- TanStack Query for cached reads
- Recharts for the dashboard

## Local development

```bash
pnpm install
cp .env.example .env.local           # fill in VITE_* vars
pnpm dev                              # http://localhost:3000
```

The default `.env.example` is wired to **devnet**. Connect Phantom, switch to
devnet, airdrop a few SOL, and mint test USDC if you need budget for campaigns.

## Deployed program

Update `VITE_PROGRAM_ID` after `anchor deploy`. The placeholder
`Fg6PaFpoGXkYsidMpWxTWqkZ6W2BeZ7FEfcYkgPq6k4f` is just the keypair-stub from
`Anchor.toml` and will not respond on-chain until you deploy your own.

After `anchor build` regenerate the IDL:

```bash
cp ../apex-contract-solana/solana/target/idl/apex_solana.json \
   client/src/lib/idl/apex_solana.json
```

## Vercel deployment (`solana.apex.network/app`)

1. Create a new Vercel project pointed at this folder.
2. Build command: `pnpm build`. Output: `dist`.
3. Add env vars from `.env.example` in **Production** + **Preview**.
4. Add domain `solana.apex.network` and CNAME `solana → cname.vercel-dns.com`.
5. To mirror `apex.network/app`, either set Vite `base: "/app/"` and add an
   `/app/(.*) → /index.html` rewrite to `vercel.json`, or serve at the root
   and configure a 301 from `/` to `/app`.

## Migration notes

- All EVM bits (wagmi/viem/Reown AppKit) were removed. The original `apex-web`
  is preserved at the sibling path for reference.
- The Subgraph query is replaced with `program.account.<X>.all()` filtered by
  `memcmp` on the `authority` field — see `lib/solana/hooks/useCampaign.ts`.
- Campaign creation is a single transaction (no SPL approve step).
