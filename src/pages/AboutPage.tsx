import React from 'react';
import { ShieldCheck, Heart, Sparkles, Droplets, Leaf } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (tab: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
          Our Philosophy
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-display">
          Raw Nature Bottled Without Compromise
        </h1>
        <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
          FreshSip was born out of frustration with pasteurized, shelf-stable juices loaded with artificial preservatives, synthetic acids, and hidden corn syrup.
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-stone-900/80 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-lg space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center">
            <Droplets className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-white">Zero Added Water</h3>
          <p className="text-xs text-stone-300 leading-relaxed">
            Every bottle is 100% pure fruit and vegetable juice. We never dilute our elixirs with tap water or ice fillers.
          </p>
        </div>

        <div className="bg-stone-900/80 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-lg space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
            <Leaf className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-white">Direct Orchard Sourcing</h3>
          <p className="text-xs text-stone-300 leading-relaxed">
            From Ratnagiri Alphonso mangoes to Nagpur sweet oranges, we source directly from certified local farmers within 24 hours of harvest.
          </p>
        </div>

        <div className="bg-stone-900/80 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-lg space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-white">Clean Room Cold Press</h3>
          <p className="text-xs text-stone-300 leading-relaxed">
            Cold-pressed in an ISO 22000 & FSSAI certified positive-pressure kitchen maintained at a constant 4°C to lock in living enzymes.
          </p>
        </div>
      </div>

      {/* Story Narrative */}
      <div className="bg-stone-900/90 backdrop-blur-sm text-stone-100 rounded-3xl p-8 sm:p-12 space-y-6 border border-stone-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider relative z-10">
          <Sparkles className="w-4 h-4" />
          <span>The FreshSip Guarantee</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white max-w-xl relative z-10">
          "If it isn't fresh enough for our own children to drink, it never enters a bottle."
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-stone-300 leading-relaxed relative z-10">
          <p>
            When standard blenders churn fruit at extreme speeds, the steel blades heat up, destroying delicate vitamin C and polyphenols before the drink even touches your lips. Masticating cold-press extraction uses gentle hydraulic pressure to extract juice drop-by-drop without heat or friction.
          </p>
          <p>
            The result? A velvety smooth beverage that retains 100% of its vibrant natural color, aromatic terpenes, and bio-available micro-nutrients. Delivered cold inside biodegradable insulated pouches to reduce environmental footprint.
          </p>
        </div>

        <div className="pt-4 border-t border-stone-800 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Crafted with love in Mumbai, India</span>
          </div>
          <button
            onClick={() => onNavigate('menu')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-amber-500/20"
          >
            Taste the Difference
          </button>
        </div>
      </div>
    </div>
  );
};
