'use client'

import { useState } from "react";
import Navbar from "./components/navbar";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import TeamSection from "./components/home/team";
import Footer from "./components/home/footer";
import PricingPlans from "./components/home/pricing-plan";
import TeslaInvestmentModal from "./components/modal/tesla-investment-modal";
import SignupModal from "./components/modal/signup";

const plans = [
  { id: "coins", title: "Coins Pool", term: "3 - 12 months", apy: "12% - 20% (est.)", desc: "Curated crypto pool with risk-managed allocations, tight stop-loss, and transparent reporting." },
  { id: "tesla", title: "Tesla Focus", term: "12 - 24 months", apy: "8% - 15% (projected)", desc: "Structured equity exposure to Tesla with dollar-cost strategies and risk overlays." },
];

const reviews = [
  { name: "Aisha K.", txt: "Consistent, transparent updates — the dashboard made tracking simple." },
  { name: "James O.", txt: "Tesla plan gave me strong long-term exposure without the noise." },
  { name: "Ngozi M.", txt: "Quick onboarding and clear risk notes. Liked the monthly snapshots." },
];

const faqs = [
  { q: "How do I join a plan?", a: "Create an account, complete KYC, fund your wallet, and allocate to any open plan." },
  { q: "Are withdrawals allowed?", a: "Yes — early withdrawals may incur adjustments depending on plan terms. Check details before allocating." },
  { q: "How is performance reported?", a: "Weekly management posts and monthly performance snapshots are published on your dashboard." },
  { q: "What are the fees?", a: "Fees vary by plan. You can view the exact fee breakdown on the plan details page before allocating funds." },
  { q: "How secure is my money?", a: "We use industry-standard encryption and segregated wallets; funds are managed under strict compliance controls." },
  { q: "Can I change my plan allocation?", a: "Yes — you can reallocate between open plans from your dashboard. Some plans may have lock-in periods." },
  { q: "Who do I contact for support?", a: "Use the in-app support chat or email support@yourdomain.com. For urgent issues, call the emergency support line in your account." },
];

export default function Home() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [revIndex, setRevIndex] = useState(0);
    const [open, setOpen] = useState(false)
      const [openSignup, setSignupOpen] = useState(false)

  return (
    <>   

    <div className="min-h-screen text-slate-100 antialiased">

       <Navbar />
      <main className="container mx-auto  space-y-14  z-10">

        

     <section className="w-full text-center text-white py-20">
  <div className="max-w-7xl mx-auto px-6">
    {/* Wrapper to center & space */}
    <div className="flex flex-col items-center text-center space-y-10">
      
      {/* Tagline */}
      <span className="inline-flex  gap-3 text-xs uppercase tracking-wide text-amber-300 font-semibold">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90 shadow-[0_6px_18px_rgba(250,204,21,0.12)]" />
        Welcome to Vanguard
      </span>

      {/* Heading */}
      <h1 className="text-6xl md:text-6xl font-extrabold leading-tight tracking-tight max-w-6xl">
        Invest with clarity. <span className="text-amber-300">Move with the smart money.</span>
      </h1>

      {/* Paragraph */}
      <p className="max-w-2xl text-lg text-slate-200">
        Curated Coins and Tesla opportunities posted by management. Transparent plans, clear risks, and performance you can verify — designed for serious investors who want clean execution and fewer gimmicks.
      </p>

     {/* Buttons */}
<div className="flex flex-wrap justify-center items-center gap-4">
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => {
      setOpen(false)
      setSignupOpen(true)
    }}
    className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-amber-400 text-black font-semibold shadow-lg shadow-amber-700/20 ring-1 ring-amber-400/20"
    aria-label="See Plans"
  >
    Get started
    <ArrowRight size={16} />
  </motion.button>

  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="inline-flex items-center gap-3 px-5 py-3 rounded-full border border-white/20 text-slate-200 font-medium bg-white/5 backdrop-blur-sm"
    aria-label="How it works"
  >
    How it works
  </motion.button>
</div>

    </div>
  </div>
</section>


    

        {/* Investment Plans */}
       <section
  id="plans"
  className="max-w-7xl mx-auto px-6 py-12"
>
  {/* Heading */}
  <h1 className="text-3xl md:text-4xl font-extrabold text-center text-white mb-12 tracking-tight">
    [Investment Plans]
  </h1>

  {/* Plans Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {plans.map((p) => (
      <motion.div
        key={p.id}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className="relative group rounded-2xl overflow-hidden"
      >
        {/* Gradient Border */}
        <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-amber-400 via-pink-500 to-violet-500 animate-gradient-x opacity-80 group-hover:opacity-100 transition duration-500"></div>

        {/* Card Content */}
        <div className="relative h-full rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-xl shadow-xl p-10 flex flex-col justify-between border-1 border-white">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-xs uppercase">{p.term}</div>
              <div className="font-extrabold text-2xl mt-1 text-white">
                {p.title}
              </div>
            </div>
            <div className="text-right">
              <div className="text-amber-300 font-semibold text-xl">
                {p.apy}
              </div>
              <div className="text-slate-500 text-sm">Projected</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-slate-300 mt-6 text-sm leading-relaxed">
            {p.desc}
          </p>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-slate-400">Min: $100</div>
            <motion.a
              whileHover={{ scale: 1.05 }}
                    onClick={() => setOpen(true)}
              whileTap={{ scale: 0.95 }}
              // href="/invest"
              className="px-5 py-2.5 rounded-full bg-amber-400 text-black font-semibold shadow-md hover:shadow-amber-400/40 transition"
            >
              Invest
            </motion.a>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
</section>



<section>
      {/* Right: info card */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-tl from-white/3 to-white/6 border border-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
            aria-hidden={false}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-amber-300 font-semibold">Recent smart move</div>
                <div className="mt-2 font-bold text-lg leading-snug text-white">New Coins Pool — Top 5 Mid-cap Rotation</div>
                <p className="text-slate-300 mt-3 text-sm leading-relaxed">Limited allocation opened for disciplined mid-cap rotation with hedging and strict exit rules. Opportunity window is time-limited.</p>

                <div className="mt-5 flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={14} className="opacity-90" />
                    <span>Aug 24, 2025</span>
                  </span>

                  <a
                    href="/posts/coins-pool"
                    className="ml-3 inline-flex items-center gap-2 text-amber-300 text-sm font-medium"
                    aria-label="Read details"
                  >
                    Read details
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>

              {/* Accent badge / micro UI */}
              <div className="hidden md:flex flex-col items-end text-sm text-slate-400">
                <div className="px-3 py-2 rounded-xl bg-white/4 border border-white/6 backdrop-blur-sm text-xs font-medium">Limited</div>
                <div className="mt-4 text-xs text-slate-400">Allocation</div>
              </div>
            </div>

            {/* subtle footer with divider */}
            <div className="mt-6 border-t border-white/6 pt-4 text-xs text-slate-400 flex items-center justify-between">
              <div>Verified performance • on-chain</div>
              <div className="text-slate-300">View terms</div>
            </div>
          </motion.div>

    </section>

        {/* Reviews + CTA */}
        <section className="rounded-2xl p-6 bg-gradient-to-br from-[#071033] to-[#08162b] border border-white/6 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <div className="text-slate-300 text-sm">User review</div>
            <div className="mt-2 text-xl font-semibold text-white max-w-xl">“{reviews[revIndex].txt}”</div>
            <div className="mt-2 text-sm text-slate-400">— {reviews[revIndex].name}</div>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setRevIndex((revIndex - 1 + reviews.length) % reviews.length)} className="px-3 py-2 rounded bg-white/6">Prev</button>
              <button onClick={() => setRevIndex((revIndex + 1) % reviews.length)} className="px-3 py-2 rounded bg-white/6">Next</button>
            </div>
          </div>

          <div className="w-full lg:w-64 text-right">
            <div className="text-slate-300 text-sm">Ready to follow smart money?</div>
            <a href="/join" className="mt-3 inline-block px-4 py-3 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 text-black font-semibold">Follow smart money — Join now</a>
          </div>
        </section>

        <PricingPlans/>

        {/* FAQ */}
       <section className="rounded-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-12 tracking-tight">
            [FAQ]
          </h1>
        </div>
        <a href="/help" className="text-amber-300 text-sm">More help</a>
      </div>

      {/* grid: 1 column on mobile, 2 per row on md+ */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {faqs.map((f, i) => (
          <div key={i} className="border border-white/6 rounded-lg overflow-hidden bg-white/3">
            <button
              onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-expanded={faqOpen === i}
              aria-controls={`faq-panel-${i}`}
            >
              <div>
                <div className="font-medium text-white">{f.q}</div>
              </div>
              <div className="text-slate-400">{faqOpen === i ? "−" : "+"}</div>
            </button>

            {faqOpen === i && (
              <div
                id={`faq-panel-${i}`}
                className="px-4 pb-4 text-slate-300 text-sm"
              >
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>

        <TeamSection
          members={[
            {
              id: "1",
              name: "Renato Jhared Birchall",
              role: "CEO & Founder",
              bio: "Leading Vanguard Investment with a vision of empowering smart financial growth.",
              image: "/team2.jpg",
            },
            {
              id: "2",
              name: "Amira Muhammad Mustafa",
              role: "Chief Investment Officer",
              bio: "Expert in global markets and innovative wealth strategies.",
              image: "/team1.jpg",
            },
            {
              id: "3",
              name: "Richard Brymo.",
              role: "Head of Technology",
              bio: "Building secure, reliable, and user-friendly platforms for investors.",
                    image: "/team3.jpg",
            },
          ]}
        />


        {/* Follow Smart Money CTA (standalone) */}
        <section className="rounded-4xl p-20  border-2 border-yellow-900 text-center ">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-4xl md:text-4xl font-bold">Follow smart money now</h3>
            <p className="max-w-xl mx-auto mt-3 text-slate-300 py-10">Join a community of investors who prefer strategy over noise. Limited allocation windows on certain pools — act smart.</p>
            <div className="mt-6 flex justify-center gap-4">
              <a onClick={() => {
      setOpen(false)
      setSignupOpen(true)
    }} className="px-6 py-3 rounded-lg bg-amber-400 text-black font-semibold shadow-lg">Join — Follow Smart Money</a>
            </div>
          </div>
        </section>
      <Footer/>
            </main>
            

         <TeslaInvestmentModal isOpen={open} onClose={() => setOpen(false)} />

          
      {/* Signup modal */}
      <SignupModal isOpen={openSignup} onClose={() => setSignupOpen(false)} />
         

    </div>
    </>
  );
}
