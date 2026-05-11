# apex-web-solana

React frontend for **APEX on Solana** — an on-chain ad network for AI agents. Talks to the [`apex-solana` Anchor program](https://github.com/hwjustin/apex-contract-solana) directly via Anchor (reads) and triggers the [validator service](https://github.com/hwjustin/apex-validator-solana) on user actions (writes).

The headline experience is in `/demo`: a Gemini-backed AI chat that recommends relevant on-chain campaigns. Clicking a recommended ad silently triggers a real `processAction` settlement — the validator pays the publisher CPA from the campaign vault, and the Validator Activity Feed below the chat reflects it in real time.

## Routes

| Path | Purpose |
|---|---|
| `/` | Home / marketing page |
| `/campaign` | Advertiser dashboard — register an agent, create / withdraw campaigns |
| `/demo` | AI chat with inline ad cards + live validator activity feed |
| `/dashboard` | Protocol-wide analytics: agents, campaigns, ads, recent settlements |

## How a settlement happens

1. User asks the AI a question on `/demo`.
2. `POST /api/chat` (Vercel Function) calls Gemini with the user prompt and every active campaign as JSON context.
3. Gemini replies with `{ reply, recommendedCampaignId? }`. If a campaign is genuinely relevant, an inline **AdCard** renders below the assistant bubble.
4. The user clicks the ad's CTA. In the background, the frontend posts to the validator service's `/api/process` endpoint.
5. The validator signs and submits a `process_action` instruction on the apex-solana program. USDC moves from the campaign vault to the publisher's USDC ATA atomically.
6. A toast confirms with the tx signature; the Validator Activity Feed flashes the new `ProcessedAction` PDA on its next 6-second poll; the `/dashboard` page reflects the new spend.

## Stack

- Vite + React 19 + TypeScript
- Tailwind 4 + shadcn primitives + lucide-react icons
- `@solana/wallet-adapter-react` (Phantom, Solflare, Ledger, WalletConnect)
- `@coral-xyz/anchor` for typed program calls
- `@tanstack/react-query` for cached reads with manual invalidation on writes
- `sonner` for toasts
- Recharts for the dashboard
- Vercel Function `api/chat.ts` → Gemini 2.5 Flash with JSON-mode output

## Local development

```bash
pnpm install
cp .env.example .env.local
# fill in:
#   VITE_PROGRAM_ID, VITE_USDC_MINT (have devnet defaults)
#   VITE_VALIDATOR_URL  (http://localhost:8787 for local validator)
#   VITE_DEMO_PUBLISHER_AGENT_ID  (a real on-chain agent id)
#   GEMINI_API_KEY  (server-side, for /api/chat)
pnpm dev
```

Connect Phantom, switch to devnet, airdrop SOL, mint test USDC if you need campaign budget.

## Vercel deployment

1. New Vercel project → import this repo.
2. Build command: `pnpm build`. Output: `dist`.
3. Set all `VITE_*` env vars in **Production** + **Preview**, plus `GEMINI_API_KEY` for the chat function.
4. `VITE_VALIDATOR_URL` should point at the deployed [apex-validator-solana](https://github.com/hwjustin/apex-validator-solana) (Railway URL).

⚠️ `VITE_*` vars are baked at build time — change them ⇒ trigger a redeploy.

## IDL sync

After redeploying the program, regenerate the IDL the client compiles against:

```bash
cp ../apex-contract-solana/solana/target/idl/apex_solana.json \
   client/src/lib/idl/apex_solana.json
```

## Related repositories

- 🟦 [apex-contract-solana](https://github.com/hwjustin/apex-contract-solana) — Anchor program
- 🟨 [apex-validator-solana](https://github.com/hwjustin/apex-validator-solana) — settlement worker
- 🟩 **[apex-web-solana](https://github.com/hwjustin/apex-web-solana)** ← you are here
- 🟪 [apex-colosseum](https://github.com/hwjustin/apex-colosseum) — parent monorepo with full architecture + demo flow
