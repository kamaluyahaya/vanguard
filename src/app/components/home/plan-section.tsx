import React from "react";
import { motion } from "framer-motion";

export interface Plan {
  id: string;
  title: string;
  term: string;
  apy: string;
  desc: string;
}

interface PlansSectionProps {
  plans: Plan[];
}

const PlansSection: React.FC<PlansSectionProps> = ({ plans }) => {
  // ensure only 2 cards are used to "cover the screen"
  const displayPlans = plans.slice(0, 2);

  return (
    <section
      id="plans"
      className="grid grid-cols-1 md:grid-cols-2 h-screen gap-8 px-6 py-12 max-w-7xl mx-auto"
    >
      {displayPlans.map((p: Plan) => (
        <motion.div
          key={p.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative group rounded-3xl overflow-hidden flex"
        >
          {/* Animated moving multi-color border */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-3xl p-[3px] bg-[linear-gradient(270deg,#facc15,#ec4899,#8b5cf6,#0ea5e9,#22c55e,#f97316,#facc15)] bg-[length:400%_400%] animate-borderMove"
          />

          {/* Card Content */}
          <div className="relative flex flex-col justify-between rounded-3xl bg-slate-900/80 backdrop-blur-xl shadow-xl p-10 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-xs uppercase">{p.term}</div>
                <div className="font-extrabold text-3xl mt-1 text-white">
                  {p.title}
                </div>
              </div>

              <div className="text-right">
                <div className="text-amber-300 font-semibold text-2xl">
                  {p.apy}
                </div>
                <div className="text-slate-500 text-sm">Projected</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-300 mt-6 text-base leading-relaxed">
              {p.desc}
            </p>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-slate-400">Min: $100</div>

              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/invest"
                aria-label={`Invest in ${p.title}`}
                className="px-6 py-2.5 rounded-full bg-amber-400 text-black font-semibold shadow-md hover:shadow-amber-400/40 transition"
              >
                Invest
              </motion.a>
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
  
}

export default PlansSection;

