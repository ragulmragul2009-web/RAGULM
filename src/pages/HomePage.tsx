import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Clock, Zap, Star } from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';

interface HomePageProps {
  categories: Category[];
  popularProducts: Product[];
  onNavigate: (tab: string, param?: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  popularProducts,
  onNavigate,
  onSelectProduct,
  onQuickAdd,
  onBuyNow,
}) => {
  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-stone-900 text-stone-100 rounded-3xl mx-3 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 border border-stone-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[480px] sm:min-h-[540px] items-center">
          {/* Left Text Zone */}
          <div className="lg:col-span-7 p-6 sm:p-12 lg:p-16 space-y-6 z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white p-0.5 border-2 border-amber-400 shadow-md shrink-0">
                <img
                  src="/logo.jpg"
                  alt="FreshSip Logo"
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold tracking-wide border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>100% Pure Raw Cold-Pressed · Never Heated</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display text-white leading-tight">
              Fresh Fruits. <br />
              <span className="text-amber-400">Fresh Juices.</span> <br />
              Fresh Life.
            </h1>

            <p className="text-sm sm:text-base text-stone-300 max-w-lg leading-relaxed">
              Handcrafted artisanal cold-pressed fruit juices, thick creamy fruit shakes, and wholesome
              berry smoothies. Zero added water, zero refined sugar, delivered chilled to your doorstep in 30 minutes.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('menu')}
                className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('menu')}
                className="px-6 py-3.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-white font-semibold text-sm border border-stone-700 transition-colors"
              >
                Explore Menu
              </button>
            </div>

            {/* Micro Trust Indicators */}
            <div className="pt-6 border-t border-stone-800/80 grid grid-cols-3 gap-4 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Sugar Added</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>30 Min Cold Drop</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Hydraulic Press</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image Zone */}
          <div className="lg:col-span-5 relative h-64 lg:h-full w-full min-h-[300px]">
            <img
              src="/src/assets/images/hero_fruit_juice_1790231167665.jpg"
              alt="Freshly pressed fruit juices"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Measured gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 lg:bg-gradient-to-r lg:from-stone-900 lg:via-stone-900/40 lg:to-transparent" />
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Curated Collections
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
              Explore by Category
            </h2>
          </div>
          <button
            onClick={() => onNavigate('menu')}
            className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>View all 24 drinks</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('menu', cat.id)}
              className="group cursor-pointer bg-stone-900/80 backdrop-blur-xs rounded-2xl border border-stone-800 p-3 hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-500/10 transition-all text-center flex flex-col items-center"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-stone-950 mb-3 relative border border-stone-800">
                <img
                  src={cat.image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                {cat.name}
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {cat.product_count ?? 4} options
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. POPULAR PRODUCTS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Customer Favorites
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
              Most Loved Juices & Shakes
            </h2>
          </div>
          <button
            onClick={() => onNavigate('menu')}
            className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Explore full menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularProducts.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onQuickAdd={onQuickAdd}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      </section>

      {/* 4. CRAFTSMANSHIP / WHY FRESHSIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900/80 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-stone-800 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              The Cold-Pressed Difference
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-2">
              Why hydraulic cold press yields 3x more live vitamins & enzymes
            </h2>
            <p className="text-sm text-stone-300 mt-3 leading-relaxed">
              Standard high-speed centrifugal blenders spin at 14,000 RPM, generating heat that kills fragile enzymes and oxidizes vital micronutrients. At FreshSip, we use a zero-heat hydraulic masticating press that gently extracts every drop of pure elixir, bottling raw nutrients in their unadulterated state.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-stone-800 relative z-10">
            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80">
              <div className="text-2xl font-black text-amber-400 font-display mb-1">0%</div>
              <h4 className="text-sm font-bold text-white">Added Refined Sugar</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Sweetness comes strictly from sun-ripened, hand-sorted seasonal orchard fruits.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80">
              <div className="text-2xl font-black text-amber-400 font-display mb-1">100%</div>
              <h4 className="text-sm font-bold text-white">Cold Hydraulic Pressed</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                No high-speed blades. Gentle hydraulic pressure protects living enzymes and rich taste.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80">
              <div className="text-2xl font-black text-amber-400 font-display mb-1">&lt; 30m</div>
              <h4 className="text-sm font-bold text-white">Insulated Delivery</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Dispatched inside food-grade thermal cooler bags so every sip is delightfully chilled.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PROMOTIONAL COUPONS BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900/90 text-stone-100 rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-rose-500/10 pointer-events-none" />
          <div className="space-y-2 max-w-xl relative z-10">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Special Celebration Offer
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              Enjoy 20% OFF on your first order
            </h3>
            <p className="text-xs sm:text-sm text-stone-300">
              Apply coupon <code className="bg-stone-950 px-2.5 py-1 rounded text-amber-300 font-mono font-bold border border-amber-500/30">FRESH20</code> at checkout. Minimum order ₹299.
            </p>
          </div>

          <button
            onClick={() => onNavigate('offers')}
            className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm whitespace-nowrap transition-all shadow-lg hover:shadow-amber-500/20 shrink-0 relative z-10"
          >
            View All Active Offers
          </button>
        </div>
      </section>

      {/* 6. VERIFIED CUSTOMER TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
            Real Customer Stories
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
            Loved by 10,000+ Fresh Drink Enthusiasts
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-stone-900/80 backdrop-blur-xs p-6 rounded-2xl border border-stone-800 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed italic">
                "The Alphonso Mango juice is mind-blowing. Tastes like freshly sliced Ratnagiri mangoes in a glass. The thermal chilled packaging arrived cold even in peak afternoon heat!"
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white">Priya Patel</span>
              <span className="text-emerald-400 font-medium">Verified Customer</span>
            </div>
          </div>

          <div className="bg-stone-900/80 backdrop-blur-xs p-6 rounded-2xl border border-stone-800 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed italic">
                "The Green Goddess Cleanse has become my weekday morning ritual. Pure celery, crisp apple, ginger, and zero bitterness. Energy levels have skyrocketed."
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white">Dr. Neha Kapoor</span>
              <span className="text-emerald-400 font-medium">Verified Customer</span>
            </div>
          </div>

          <div className="bg-stone-900/80 backdrop-blur-xs p-6 rounded-2xl border border-stone-800 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed italic">
                "Customizing sugar level and ice preference is a game-changer! I get the Wild Strawberry Bliss with No Sugar and chia seeds. Perfect post-workout nourishment."
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white">Vikram Joshi</span>
              <span className="text-emerald-400 font-medium">Verified Customer</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
