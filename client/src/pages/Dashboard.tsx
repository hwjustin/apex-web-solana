/**
 * Global analytics dashboard — protocol-wide rollup of campaigns, ads, and
 * verified actions sourced directly from program account scans.
 */

import { useMemo } from "react";
import { Link } from "wouter";
import BN from "bn.js";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { WalletButton } from "@/components/WalletButton";
import { useAllCampaigns } from "@/lib/solana/hooks/useCampaign";
import { useAllAds, useAllProcessedActions } from "@/lib/solana/hooks/useAds";
import { useGlobalState } from "@/lib/solana/hooks/useAgent";
import { formatUsdc } from "@/lib/solana/utils";

const PIE_COLORS = ["#FACC15", "#9945FF", "#14F195", "#0052FF", "#000000"];

export default function Dashboard() {
  const { data: globalState } = useGlobalState();
  const { data: campaigns = [] } = useAllCampaigns();
  const { data: ads = [] } = useAllAds();
  const { data: actions = [] } = useAllProcessedActions();

  const totals = useMemo(() => {
    const budget = campaigns.reduce((acc, c) => acc.add(c.budgetAmount), new BN(0));
    const spent = campaigns.reduce((acc, c) => acc.add(c.spentAmount), new BN(0));
    return { budget, spent, remaining: budget.sub(spent) };
  }, [campaigns]);

  const spendByCampaign = useMemo(
    () =>
      campaigns
        .slice(0, 10)
        .map((c) => ({
          name: `#${c.campaignId.toString()}`,
          spent: Number(formatUsdc(c.spentAmount)),
          remaining: Number(formatUsdc(c.budgetAmount.sub(c.spentAmount))),
        })),
    [campaigns],
  );

  const adsByPublisher = useMemo(() => {
    const map = new Map<string, number>();
    ads.forEach((a) => {
      const k = a.publisherId.toString();
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([k, v]) => ({ name: `Publisher #${k}`, value: v }))
      .slice(0, 6);
  }, [ads]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/apex-logo.png" alt="APEX" className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/campaign" className="text-sm text-gray-600">Campaigns</Link>
            <Link href="/demo" className="text-sm text-gray-600">Demo</Link>
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="pt-24 container pb-16 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold">Protocol Dashboard</h1>
          <p className="text-gray-500">
            Live state from the apex-solana program. Updated each refresh.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card label="Agents" value={globalState ? globalState.agentCount.toString() : "—"} />
          <Card label="Campaigns" value={globalState ? globalState.campaignCount.toString() : "—"} />
          <Card label="Ads" value={globalState ? globalState.adCount.toString() : "—"} />
          <Card label="Total budget" value={`${formatUsdc(totals.budget)} USDC`} />
          <Card label="Total spent" value={`${formatUsdc(totals.spent)} USDC`} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel title="Spend by campaign (top 10)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendByCampaign}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="spent" stackId="a" fill="#FACC15" />
                  <Bar dataKey="remaining" stackId="a" fill="#000000" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Ads by publisher">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={adsByPublisher} dataKey="value" nameKey="name" outerRadius={100}>
                    {adsByPublisher.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title="Recent verified actions">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr className="text-left">
                  <th className="px-4 py-2">Campaign</th>
                  <th className="px-4 py-2">Publisher</th>
                  <th className="px-4 py-2">Validator</th>
                  <th className="text-right px-4 py-2">USDC</th>
                  <th className="text-right px-4 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {actions.slice(0, 25).map((a) => (
                  <tr key={a.pubkey.toBase58()} className="border-t border-gray-100">
                    <td className="px-4 py-2">#{a.campaignId.toString()}</td>
                    <td className="px-4 py-2">#{a.publisherId.toString()}</td>
                    <td className="px-4 py-2">#{a.validatorId.toString()}</td>
                    <td className="px-4 py-2 text-right">{formatUsdc(a.paymentAmount)}</td>
                    <td className="px-4 py-2 text-right text-gray-500">
                      {new Date(a.processedAt.toNumber() * 1000).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {actions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No verified actions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-extrabold text-lg mb-3">{title}</h3>
      {children}
    </div>
  );
}
