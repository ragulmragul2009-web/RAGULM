import React from 'react';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Zap,
  Star,
  Heart,
  Droplets,
  Truck,
  Leaf,
  Award,
  ChevronRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Product, Category } from '../types';

interface FirstPageProps {
  categories: Category[];
  popularProducts: Product[];
  onNavigate: (tab: string, param?: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const FirstPage: React.FC<FirstPageProps> = ({
  categories,
  popularProducts,
  onNavigate,
  onSelectProduct,
  onQuickAdd,
}) => {
  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SPLASH ENTRANCE */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white pt-10 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
        {/* Subtle decorative glow circles */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10 space-y-8">
          {/* Logo Badge Header */}
          <div className="inline-flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 blur-sm opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse" />
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-white p-2 border-4 border-amber-400 shadow-2xl flex items-center justify-center">
                <img
                  src="/logo.jpg"
                  alt="FreshSip Brand Logo"
                  className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-bold border border-amber-500/40">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Welcome to FreshSip Juice Shop · 100% Artisanal Cold-Pressed</span>
            </div>
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-display text-white leading-[1.1]">
              Fresh Fruits. <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-amber-300">Fresh Juices.</span> Fresh Life.
            </h1>
            <p className="text-base sm:text-xl text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Experience the purest flavors of freshly harvested orchards. Cold-pressed with zero heat, no added water, and zero refined sugar. Delivered chilled in under 30 minutes.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('home')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-extrabold text-base flex items-center gap-2.5 transition-all shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
            >
              <span>Enter Juice Shop</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate('menu')}
              className="px-8 py-4 rounded-2xl bg-stone-800/90 hover:bg-stone-800 text-white font-bold text-base border border-stone-700 hover:border-amber-400/50 transition-all hover:-translate-y-0.5"
            >
              Explore Full Menu
            </button>

            <button
              onClick={() => onNavigate('offers')}
              className="px-6 py-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-base border border-rose-500/40 transition-all flex items-center gap-2"
            >
              <Flame className="w-5 h-5 text-rose-400" />
              <span>Today's Offers</span>
            </button>
          </div>

          {/* Trust Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-stone-800/80 text-center">
            <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-700/50">
              <span className="block text-2xl font-black text-amber-400 font-display">100%</span>
              <span className="text-xs text-stone-400">Raw Cold-Pressed</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-700/50">
              <span className="block text-2xl font-black text-emerald-400 font-display">0g</span>
              <span className="text-xs text-stone-400">Added Refined Sugar</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-700/50">
              <span className="block text-2xl font-black text-sky-400 font-display">30 Min</span>
              <span className="text-xs text-stone-400">Fast Cold Delivery</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-700/50">
              <span className="block text-2xl font-black text-rose-400 font-display">4.9 ★</span>
              <span className="text-xs text-stone-400">From 10,000+ Sippers</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROMOTIONAL FEATURE SHOWCASE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-200">
          <img
            src="/src/assets/images/welcome_hero_1790247484651.jpg"
            alt="FreshSip Cold Pressed Juices Selection"
            className="w-full h-80 sm:h-96 object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/60 to-transparent flex items-center p-6 sm:p-12">
            <div className="max-w-lg space-y-4 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black uppercase tracking-wider">
                Fresh Harvest Special
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-display leading-tight">
                Crafted Daily From Certified Organic Orchards
              </h2>
              <p className="text-sm sm:text-base text-stone-200 leading-relaxed">
                Every bottle contains up to 1.5 kg of fresh whole fruits, gently pressed using hydraulic pressure to preserve delicate vitamins, live enzymes, and vibrant natural flavors.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('menu')}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm inline-flex items-center gap-2 shadow-md transition-colors"
                >
                  <span>Order Fresh Bottle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOUR CORE PILLARS OF FRESHSIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            The FreshSip Guarantee
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Why Our Juices Taste Remarkably Different
          </h2>
          <p className="text-sm text-stone-300">
            We believe pure juice should be just that — pure, untouched by heat, chemicals, or artificial concentrates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-stone-900/80 backdrop-blur-sm border border-stone-800 hover:border-amber-500/40 shadow-lg hover:shadow-amber-500/5 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-display">Hydraulic Cold-Pressed</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Extracted slowly with zero centrifugal heat blades. Retains 100% of vital micro-nutrients, minerals, and live enzymes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-900/80 backdrop-blur-sm border border-stone-800 hover:border-emerald-500/40 shadow-lg hover:shadow-emerald-500/5 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-display">100% Pure & Raw</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              No added cane sugar, zero preservatives, no artificial coloring, and zero water dilution. Just raw pressed fruit.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-900/80 backdrop-blur-sm border border-stone-800 hover:border-sky-500/40 shadow-lg hover:shadow-sky-500/5 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-display">30-Min Chilled Dispatch</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Bottled on order in thermal chill packs and delivered directly to your doorstep in Mumbai at optimum drinking temperature.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-900/80 backdrop-blur-sm border border-stone-800 hover:border-rose-500/40 shadow-lg hover:shadow-rose-500/5 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-display">Eco Glass Bottling</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Packaged in 100% BPA-free recyclable amber-safe glass bottles. Better for your health, better for the planet.
            </p>
          </div>
        </div>
      </section>

      {/* 4. EXPLORE BY JUICE CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              Juice Bar Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Explore Our Drink Families
            </h2>
          </div>
          <button
            onClick={() => onNavigate('menu')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigate('menu', cat.id)}
              className="group p-4 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-500/10 transition-all text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-950 mb-3 border-2 border-amber-500/30 group-hover:border-amber-400 group-hover:scale-105 transition-all">
                <img
                  src={cat.image || (cat as any).image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                {cat.name}
              </h3>
              <span className="text-[11px] text-stone-400 group-hover:text-amber-300 mt-1">Explore →</span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. TOP POPULAR JUICES PREVIEW */}
      {popularProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                Customer Favorites
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Most Loved Fresh Blends
              </h2>
            </div>
            <button
              onClick={() => onNavigate('menu')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>See Full Juice Menu ({popularProducts.length}+)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularProducts.slice(0, 4).map((product) => (
              <div
                key={product.id}
                className="bg-stone-900/85 backdrop-blur-xs rounded-2xl border border-stone-800/90 overflow-hidden shadow-lg hover:shadow-amber-500/10 hover:border-amber-500/40 transition-all flex flex-col group"
              >
                <div
                  className="relative h-44 overflow-hidden cursor-pointer bg-stone-950"
                  onClick={() => onSelectProduct(product)}
                >
                  <img
                    src={product.image || (product as any).image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-amber-500 text-stone-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                    ★ {product.rating} Best Seller
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3
                      onClick={() => onSelectProduct(product)}
                      className="font-bold text-white hover:text-amber-400 cursor-pointer text-sm font-display transition-colors"
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs text-stone-400 line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                    <div>
                      <span className="text-base font-extrabold text-white">
                        ₹{product.discount_price ?? product.price}
                      </span>
                      {product.discount_price && (
                        <span className="text-xs text-stone-500 line-through ml-1.5">
                          ₹{product.price}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onQuickAdd(product)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-amber-500/20"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. HEALTH & WELLNESS GOAL SELECTOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-stone-900/80 backdrop-blur-sm border border-stone-800 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-8 relative z-10">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Functional Nutrition
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Target Your Daily Wellness Goal
            </h2>
            <p className="text-xs sm:text-sm text-stone-300">
              Each recipe is dietitian-calibrated to deliver concentrated vitamins for specific bodily benefits.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
            {[
              { label: 'Immunity Boost', icon: '🛡️', cat: 'cat_fresh_juices', desc: 'Vitamin C & Citrus' },
              { label: 'Deep Detox', icon: '🥒', cat: 'cat_healthy_drinks', desc: 'Cucumber, Spinach, Mint' },
              { label: 'Instant Energy', icon: '⚡', cat: 'cat_fruit_shakes', desc: 'Banana & Mango Complex' },
              { label: 'Skin Glow', icon: '✨', cat: 'cat_smoothies', desc: 'Pomegranate & Berries' },
              { label: 'Workout Recovery', icon: '💪', cat: 'cat_smoothies', desc: 'Chia & Plant Protein' },
            ].map((goal, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate('menu', goal.cat)}
                className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-500/10 transition-all text-center flex flex-col items-center group"
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{goal.icon}</span>
                <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">{goal.label}</span>
                <span className="text-[10px] text-stone-400 mt-1">{goal.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM BANNER TO ENTER SHOP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-stone-900/90 text-white flex flex-col sm:flex-row items-center justify-between gap-6 border border-stone-800 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-rose-500/10 pointer-events-none" />
          <div className="space-y-2 text-center sm:text-left relative z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
              Ready to Taste the Orchard Difference?
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm max-w-md">
              Order fresh cold-pressed bottles or customize your toppings, sweetness, and ice level.
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all"
            >
              <span>Visit Shop Front</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('menu')}
              className="px-6 py-3.5 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl text-sm transition-colors border border-stone-700"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
