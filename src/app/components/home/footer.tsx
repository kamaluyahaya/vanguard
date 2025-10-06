import { motion } from "framer-motion";
import { Twitter, Linkedin, Youtube, Send } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className=" text-slate-300  border-slate-800 py-20">
      <div className="mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Logo & Newsletter */}
        <div className="">
          <h2 className="text-white font-bold text-xl">Vanguard Investment</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Join our newsletter to stay up to date on features and releases.
          </p>

          {/* Newsletter Form */}
          <form className="mt-4 flex items-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-l-full bg-slate-800 text-sm text-white border border-slate-700 focus:outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-5 py-2 rounded-r-full bg-amber-400 text-black font-semibold shadow hover:shadow-amber-400/40 transition"
            >
              Subscribe
            </motion.button>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            By subscribing you agree with our{" "}
            <a href="/privacy" className="text-amber-400 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
            Platform
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/" className="hover:text-amber-400">Home</Link></li>
            <li><a href="/trades" className="hover:text-amber-400">Trades View</a></li>
            <li><a href="/priority" className="hover:text-amber-400">Priority Trades</a></li>
            <li><a href="/ai-bot-youtube" className="hover:text-amber-400">AI-Bot YouTube</a></li>
            <li><a href="/ai-bot-telegram" className="hover:text-amber-400">AI-Bot Telegram</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
            Resources
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="/onchain" className="hover:text-amber-400">On-chain Analysis</a></li>
            <li><a href="/leader" className="hover:text-amber-400">Leader</a></li>
            <li><a href="/reviews" className="hover:text-amber-400">Reviews</a></li>
            <li><a href="/faq" className="hover:text-amber-400">FAQ</a></li>
            <li><a href="/reports" className="hover:text-amber-400">Reports</a></li>
            <li><a href="/pricing" className="hover:text-amber-400">Pricing</a></li>
          </ul>
        </div>

        {/* Social & Disclaimer */}
        <div>
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
            Follow Us
          </h3>
          <div className="flex items-center space-x-4 mt-4">
            <a href="#" className="hover:text-amber-400"><Twitter size={18} /></a>
            <a href="#" className="hover:text-amber-400"><Linkedin size={18} /></a>
            <a href="#" className="hover:text-amber-400"><Youtube size={18} /></a>
            <a href="#" className="hover:text-amber-400"><Send size={18} /></a>
          </div>
         
        </div>
      </div>
      <div className="text-center text-7xl font-bold pt-15">
        <h1>Vanguard Investment</h1>
      </div>

      {/* Bottom Bar */}

      <div className="border-t-2 border-white mt-10 py-6 px-20  text-xs text-slate-500">
        <div>
            <b>Disclamer</b>
             <p className="mt-6 text-xs text-slate-500 leading-relaxed">
            You bear sole responsibility for your financial decisions. Vanguard
            Investment is not liable for any losses or damages resulting from
            your actions or inactions based on our content. Our insights are for
            informational and educational purposes only, not investment advice.
          </p>
        </div>
        
        <div className="border-t border-slate-800 mt-10 py-6 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between">
  <p>© 2025 Vanguard Investment. All rights reserved.</p>
  <div className="mt-2 md:mt-0 space-x-4">
    <a href="/privacy" className="hover:text-amber-400">Privacy Policy</a>
    <a href="/terms" className="hover:text-amber-400">Terms of Service</a>
    <a href="/cookies" className="hover:text-amber-400">Cookies Settings</a>
  </div>
</div>
      </div>
    </footer>
  );
}
