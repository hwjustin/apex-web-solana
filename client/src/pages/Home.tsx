/*
 * APEX Landing Page - Bold Geometric Modernism Design
 *
 * Design Philosophy:
 * - Geometric shapes as structural and decorative elements
 * - Bold, unapologetic color blocking with APEX palette (Yellow #FACC15, Black, White)
 * - Clear visual hierarchy through scale and weight
 * - Poppins typography (400-800 weights)
 *
 * Signature Elements:
 * - Circular badges and pill-shaped buttons
 * - Bold stat cards with alternating yellow/black backgrounds
 * - Arrow icons as recurring motifs
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Shield, Zap, Users, BarChart3, Globe } from "lucide-react";
import { WalletButton } from "@/components/WalletButton";
import { GetStartedButton } from "@/components/GetStartedButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="container flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-2">
            <img
              src="/images/apex-logo.png"
              alt="APEX"
              className="h-8 md:h-10 w-auto"
            />
          </div>


          <WalletButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-24 relative overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="inline-flex items-center gap-2 bg-[#FACC15] text-black px-4 py-2 rounded-full text-sm font-semibold">
                  <span>Built on ERC-8004</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white px-4 py-2 rounded-full text-sm font-semibold">
                  <img src="/images/solana-logo.svg" alt="Solana" className="w-5 h-5" />
                  <span>Solana {import.meta.env.VITE_SOLANA_NETWORK === "mainnet-beta" ? "Mainnet" : "Devnet"}</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                The Future<br />
                <span className="text-[#FACC15]">AI-Native</span><br />
                Ad Infrastructure
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg">
                APEX connects advertisers with AI agents through decentralized, trustless coordination.
                Power the next generation of digital advertising.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <GetStartedButton />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative flex justify-center">
                <img
                  src="/images/img.png"
                  alt="Blockchain AI Network"
                  className="max-h-[70vh] w-auto rounded-2xl rotate-90"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-40 right-0 w-64 h-64 bg-[#FACC15]/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#DDD6FE]/20 rounded-full blur-3xl -z-10" />
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-16 md:py-24 bg-[#FACC15]">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 text-black">
                Establishing AI-Native<br />Ads Infrastructure
              </h2>

              <p className="text-lg text-gray-800 mb-8">
                APEX provides the missing economic backbone and infrastructure that turns every agent
                interaction into a sustainable, trustless, and monetizable revenue channel.
              </p>

              <div className="space-y-4">
                {[
                  "Content Delivery for AI Agents",
                  "Interaction Tracking & Verification",
                  "Automatic Payment Settlement",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-black">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <img
                src="/images/advertisement_new.png"
                alt="APEX Advertisement Infrastructure"
                className="w-full h-[320px] object-fill"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Next-Gen Ad Infra Section */}
      <section className="py-16 md:py-24 bg-black text-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6">
              Next-Gen Ad Infra
            </h2>
          </motion.div>

          <div className="space-y-12">
            {[
              {
                title: "Decentralization",
                icon: Globe,
                badge: "bg-white text-black",
                description: "Unlike current digital advertising where few platforms (Google, TikTok) control the traffic, the future of AI agents will be decentralized, which requires effective coordination between advertisers and publishers (AI applications)."
              },
              {
                title: "Goal Alignment",
                icon: Zap,
                badge: "bg-[#FACC15] text-black",
                description: "Current pricing models (CPC, CPM) cause the misalignment of business goals between advertisers and publishers. Next-gen ad infra will support more accurate and flexible pricing strategies to align the goal of AI agents and advertisers."
              },
              {
                title: "Trust",
                icon: Shield,
                badge: "bg-[#DDD6FE] text-black",
                description: "The bidding mechanisms, measurements, and reporting are all currently controlled by centralized platforms. A trustless system is needed to coordinate future advertiser and AI agents to effectively complete the ads."
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="border-b border-gray-800 pb-8"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full ${item.badge} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 flex items-center gap-2">
                      {item.title}
                      <ArrowUpRight className="w-5 h-5 text-[#FACC15]" />
                    </h3>
                    <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">
              How <span className="text-[#FACC15]">APEX</span> Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A two-layer architecture combining on-chain transparency with off-chain flexibility.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* On-Chain Registry */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-[#FACC15] p-8 md:p-10 rounded-3xl"
            >
              <h3 className="text-2xl md:text-3xl font-extrabold mb-6 text-black">On-Chain Registry</h3>
              <p className="text-gray-800 mb-8">
                Advertiser & publisher identities, campaign metadata, and ad transactions are recorded
                on-chain—enabling decentralization, transparency, and verifiable coordination across AI agents.
              </p>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Users, label: "Identity Registry" },
                  { icon: BarChart3, label: "Campaign Registry" },
                  { icon: Zap, label: "Ad Registry" },
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 mx-auto bg-black rounded-2xl flex items-center justify-center mb-3">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-black">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Off-Chain Validators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-black p-8 md:p-10 rounded-3xl text-white"
            >
              <h3 className="text-2xl md:text-3xl font-extrabold mb-6">Off-Chain Validators</h3>
              <p className="text-gray-400 mb-8">
                A decentralized validator network verifies various ad execution, enforces campaign rules,
                and settles payments—providing a trustless, flexible validation layer.
              </p>

              <div className="space-y-4">
                {[
                  "Verify Various Signals (Impression, Click, Conversion)",
                  "Web3-Native: On-Chain Actions",
                  "Customized: Specific user actions based on advertiser demand",
                  "Automatic Payment Settlement",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#FACC15] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                    <span className="text-sm text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Advertisers & Publishers */}
      <section id="for-you" className="py-16 md:py-24 bg-gray-50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">
              Built for <span className="text-[#FACC15]">Everyone</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* For Advertisers */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 md:p-10 rounded-3xl border-2 border-gray-100 hover:border-[#FACC15] transition-colors"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src="/images/advertiser-illustration.png"
                  alt="For Advertisers"
                  className="w-20 h-20 object-contain"
                />
                <h3 className="text-2xl md:text-3xl font-extrabold">For Advertisers</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Reach AI agents and their users with precision targeting. Pay only for verified outcomes
                with transparent, on-chain settlement.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Access decentralized AI agent network",
                  "Flexible pricing models (CPA, CPO, Custom)",
                  "Transparent, verifiable ad delivery",
                  "Automatic payment settlement",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-[#FACC15]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold py-6 rounded-full">
                Start Advertising
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>

            {/* For Publishers */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-8 md:p-10 rounded-3xl border-2 border-gray-100 hover:border-black transition-colors"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src="/images/publisher-illustration.png"
                  alt="For Publishers"
                  className="w-20 h-20 object-contain"
                />
                <h3 className="text-2xl md:text-3xl font-extrabold">For Publishers</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Monetize your AI agent or application with relevant, non-intrusive ads.
                Earn trustless payments for every verified interaction.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Easy SDK integration",
                  "Access premium advertiser campaigns",
                  "Real-time earnings tracking",
                  "Instant, trustless payouts",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-black" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-black hover:bg-gray-800 text-white font-bold py-6 rounded-full">
                Start Publishing
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-black text-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6">
              Ready to Join the<br />
              <span className="text-[#FACC15]">Future of Advertising?</span>
            </h2>

            <p className="text-lg text-gray-400 mb-8">
              Connect your wallet to get started with APEX. Whether you're an advertiser looking
              to reach AI agents or a publisher ready to monetize, we've got you covered.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <WalletButton />
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-black font-bold px-10 py-6 rounded-full text-lg">
                Learn More
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img
                src="/images/apex-logo.png"
                alt="APEX"
                className="h-10 w-auto"
              />
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="https://eips.ethereum.org/EIPS/eip-8004" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors flex items-center gap-1">
                ERC-8004 <ArrowUpRight className="w-3 h-3" />
              </a>
              <a href="https://x.com/apexad" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors flex items-center gap-1">
                X (Twitter) <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            <div className="text-sm text-gray-500">
              © 2026 APEX Network. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
