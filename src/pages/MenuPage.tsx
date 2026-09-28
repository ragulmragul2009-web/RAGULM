import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, RotateCcw, X } from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';

interface MenuPageProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({
  products,
  categories,
  initialCategory,
  onSelectProduct,
  onQuickAdd,
  onBuyNow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedSort, setSelectedSort] = useState<string>('popular');
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [minRating, setMinRating] = useState<number>(0);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category check
      if (
        selectedCategory !== 'all' &&
        product.category_id !== selectedCategory &&
        product.category?.slug !== selectedCategory
      ) {
        return false;
      }

      // Search query check (name, description, ingredients, category name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        const matchesCat = product.category?.name.toLowerCase().includes(q);
        const matchesIng = product.ingredients.some((ing) => ing.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesCat && !matchesIng) {
          return false;
        }
      }

      // Max price check
      const effectivePrice = product.discount_price ?? product.price;
      if (effectivePrice > maxPrice) {
        return false;
      }

      // Min rating check
      if (minRating > 0 && product.rating < minRating) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.discount_price ?? a.price;
      const priceB = b.discount_price ?? b.price;

      switch (selectedSort) {
        case 'price_asc':
          return priceA - priceB;
        case 'price_desc':
          return priceB - priceA;
        case 'highest_rated':
          return b.rating - a.rating || b.reviews_count - a.reviews_count;
        case 'popular':
        default:
          if (a.is_popular === b.is_popular) {
            return b.rating - a.rating;
          }
          return a.is_popular ? -1 : 1;
      }
    });
  }, [products, selectedCategory, searchQuery, maxPrice, minRating, selectedSort]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSort('popular');
    setMaxPrice(300);
    setMinRating(0);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    maxPrice < 300 ||
    minRating > 0 ||
    selectedSort !== 'popular';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div>
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
          Fresh Cold-Pressed Catalog
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display mt-1">
          Artisanal Juice & Smoothie Menu
        </h1>
        <p className="text-xs sm:text-sm text-stone-300 mt-1">
          Explore our handcrafted beverages made to order from freshly pressed raw orchard produce.
        </p>
      </div>

      {/* Control Bar: Search & Quick Category Pills */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search juices, shakes, ingredients (e.g. mango, chia, mint, apple)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-800 bg-stone-900/90 text-white placeholder-stone-400 focus:outline-none focus:border-amber-400 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="hidden sm:block">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-stone-800 bg-stone-900 text-xs font-semibold text-stone-200 focus:outline-none focus:border-amber-400"
            >
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="highest_rated">Highest Rated</option>
            </select>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            className="sm:hidden p-2.5 border border-stone-800 rounded-xl bg-stone-900 text-stone-200 flex items-center gap-1.5 text-xs font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        {/* Category Segmented Scrollable Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-stone-900/80 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700'
            }`}
          >
            All Drinks ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-stone-900/80 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Bar (Desktop & Expanded Mobile) */}
      <div
        className={`${
          filterDrawerOpen ? 'block' : 'hidden sm:flex'
        } p-4 bg-stone-900/85 backdrop-blur-xs rounded-2xl border border-stone-800 shadow-md items-center justify-between gap-6 flex-wrap`}
      >
        <div className="flex flex-wrap items-center gap-6 text-xs text-stone-300 flex-1">
          {/* Max Price Slider */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <span className="font-semibold text-stone-400">Max Price:</span>
            <input
              type="range"
              min="90"
              max="300"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-amber-500 flex-1 cursor-pointer"
            />
            <span className="font-mono font-bold text-amber-400 tabular-nums">₹{maxPrice}</span>
          </div>

          {/* Min Rating */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-400">Min Rating:</span>
            <div className="flex items-center gap-1">
              {[0, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                    minRating === r
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {r === 0 ? 'All' : `${r}★+`}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Selector for Mobile */}
          <div className="sm:hidden flex items-center gap-2 w-full pt-2">
            <span className="font-semibold text-stone-400">Sort:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-stone-800 bg-stone-950 text-xs font-medium text-stone-200"
            >
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="highest_rated">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Reset Active Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 self-end sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>
          Showing <strong className="text-white">{filteredProducts.length}</strong> of{' '}
          {products.length} beverages
        </span>
        {searchQuery && (
          <span>
            Search results for "<em>{searchQuery}</em>"
          </span>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onQuickAdd={onQuickAdd}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-stone-900/80 rounded-3xl border border-stone-800 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-stone-950 border border-stone-800 mx-auto flex items-center justify-center text-3xl">
            🍹
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">No drinks match your filters</h3>
          <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
            Try resetting your price limit, rating filter, or search keywords to view our full menu.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-amber-500/20"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
