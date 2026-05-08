/**
 * Publisher dashboard — shows the connected wallet's earnings and ads served.
 */

import { useMemo } from "react";
import { Link } from "wouter";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "lucide-react";
import BN from "bn.js";

import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/WalletButton";
import { useAgentByAuthority } from "@/lib/solana/hooks/useAgent";
import { useAllAds, useAllProcessedActions } from "@/lib/solana/hooks/useAds";
import { formatUsdc, truncateBase58 } from "@/lib/solana/utils";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function Publisher() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { data: agent } = useAgentByAuthority(publicKey ?? null);
  const { data: ads = [] } = useAllAds();
  const { data: actions = [] } = useAllProcessedActions();

  const myAds = useMemo(
    () => (agent ? ads.filter((a) => a.publisherId.eq(agent.agentId)) : []),
    [ads, agent],
  );
  const myActions = useMemo(
    () => (agent ? actions.filter((a) => a.publisherId.eq(agent.agentId)) : []),
    [actions, agent],
  );
  const earnings = useMemo(
    () => myActions.reduce((acc, a) => acc.add(a.paymentAmount), new BN(0)),
    [myActions],
  );

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/apex-logo.png" alt="APEX" className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/campaign" className="text-sm text-gray-600">Campaigns</Link>
            <Link href="/demo" className="text-sm text-gray-600">Demo</Link>
            <Link href="/dashboard" className="text-sm text-gray-600">Dashboard</Link>
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="pt-24 container max-w-4xl pb-12">
        <h1 className="text-3xl font-extrabold mb-2">Publisher</h1>
        <p className="text-gray-500 mb-6">
          On-chain earnings for the agent registered to this wallet.
        </p>

        {!connected && (
          <div className="bg-gray-50 rounded-2xl p-10 text-center">
            <Wallet className="w-10 h-10 mx-auto text-[#FACC15] mb-4" />
            <Button onClick={() => setVisible(true)} className="bg-black text-white rounded-full">
              Connect Wallet
            </Button>
          </div>
        )}

        {connected && !agent && (
          <div className="bg-gray-50 rounded-2xl p-10 text-center text-gray-500">
            This wallet is not registered as an APEX agent yet.{" "}
            <Link href="/campaign" className="text-black underline">Register here</Link>.
          </div>
        )}

        {agent && (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <Card label="Total earned" value={`${formatUsdc(earnings)} USDC`} />
              <Card label="Ads served" value={myAds.length.toString()} />
              <Card label="Verified actions" value={myActions.length.toString()} />
            </div>

            <h2 className="font-extrabold text-xl mb-3">Recent payouts</h2>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              {myActions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No verified actions yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-2">Campaign</th>
                      <th className="text-left px-4 py-2">Validator</th>
                      <th className="text-left px-4 py-2">Action</th>
                      <th className="text-right px-4 py-2">USDC</th>
                      <th className="text-right px-4 py-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myActions.map((a) => (
                      <tr key={a.pubkey.toBase58()} className="border-t border-gray-100">
                        <td className="px-4 py-2 font-mono">#{a.campaignId.toString()}</td>
                        <td className="px-4 py-2 font-mono">#{a.validatorId.toString()}</td>
                        <td className="px-4 py-2 font-mono">
                          {truncateBase58(Buffer.from(a.actionHash).toString("hex"), 6)}
                        </td>
                        <td className="px-4 py-2 text-right">{formatUsdc(a.paymentAmount)}</td>
                        <td className="px-4 py-2 text-right text-gray-500">
                          {new Date(a.processedAt.toNumber() * 1000).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="text-xs uppercase text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}
