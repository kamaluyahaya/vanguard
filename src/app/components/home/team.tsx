"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import Image from "next/image";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
}

interface TeamSectionProps {
  members: TeamMember[];
}

export default function TeamSection({ members }: TeamSectionProps) {
  return (
    <section id="team" className="mx-auto px-6 py-20">
      {/* Heading */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-14 tracking-tight">
        [Meet the Vanguard Investment Team]
      </h1>

      {/* Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
        {members.map((m) => (
          <motion.div
            key={m.id}
            whileHover={{ scale: 1.03, y: -6 }}
            transition={{ type: "spring", stiffness: 220 }}
            className="relative group rounded-2xl overflow-hidden"
          >
            {/* Gradient Border */}
            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-amber-400 via-pink-500 to-violet-500 opacity-75 group-hover:opacity-100 transition duration-500"></div>

            {/* Card Content */}
            <div className="relative h-full rounded-2xl bg-gradient-to-br from-slate-900/85 to-slate-800/60 backdrop-blur-xl shadow-xl p-8 flex flex-col items-center text-center border border-slate-700">
              {/* Profile Image */}
              <div className="w-24 h-24 rounded-full overflow-hidden border border-slate-600 shadow-md relative">
                {m.image ? (
                  <Image
                    src={m.image}
                    alt={m.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-300">
                    <User size={36} />
                  </div>
                )}
              </div>

              {/* Info */}
              <h2 className="mt-4 text-lg font-semibold text-white">{m.name}</h2>
              <p className="text-amber-300 text-sm">{m.role}</p>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">{m.bio}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
