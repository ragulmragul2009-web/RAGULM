import React, { useState, useMemo } from 'react';
import { Search, X, Star, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigateToMenuWithQuery: (query: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onNavigateToMenuWithQuery,
}) => {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products
      .filter((p) => {
        const inName = p.name.toLowerCase().includes(q);
        const inDesc = p.description.toLowerCase().includes(q);
        const inIng = p.ingredients.some((i) => i.toLowerCase().includes(q));
        const inCat = p.category?.name.toLowerCase().includes(q);
        return inName || inDesc || inIng || inCat;
      })
      .slice(0, 6);
  }, [query, products]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in">
      <div className="bg-stone-900/95 backdrop-blur-md rounded-3xl max-w-xl w-full shadow-2xl border border-stone-800 overflow-hidden text-stone-100">
        {/* Input Bar */}
        <div className="p-4 border-b border-stone-800 flex items-center gap-3 bg-stone-950/70">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search juices, shakes, ingredients (e.g. mango, chia, berry, protein)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-stone-100 placeholder-stone-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {query.trim() === '' ? (
            <div className="py-6 text-center text-xs text-stone-400 space-y-2">
              <span className="text-xl block">🍹</span>
              <span>Popular searches: Alphonso Mango, Strawberry Smoothie, Cold Cleanse, Chia, Shake</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No matching drinks found for "<span className="text-amber-300 font-semibold">{query}</span>".
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-stone-800/80 transition-colors cursor-pointer border border-transparent hover:border-amber-500/30"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover bg-stone-800 shrink-0 border border-stone-700/50"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-stone-400">
                        <span>{product.category?.name || 'Drink'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs sm:text-sm text-amber-400 tabular-nums">
                      ₹{product.discount_price ?? product.price}
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-500" />
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-stone-800 text-center">
                <button
                  onClick={() => {
                    onNavigateToMenuWithQuery(query);
                    onClose();
                  }}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  View all results in Menu →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
