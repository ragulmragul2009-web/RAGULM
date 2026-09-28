import React, { useState } from 'react';
import { Star, Plus, Zap } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickAdd,
  onBuyNow,
}) => {
  const [imgError, setImgError] = useState(false);
  const displayPrice = product.discount_price ?? product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  // Category label fallback
  const categoryLabel = product.category?.name || 'Fresh Juice';

  return (
    <div className="group bg-stone-900/85 backdrop-blur-xs rounded-2xl border border-stone-800/90 hover:border-amber-500/40 shadow-lg hover:shadow-amber-500/10 transition-all duration-200 flex flex-col overflow-hidden text-left relative">
      {/* Visual Slot */}
      <div
        onClick={() => onSelect(product)}
        className="relative w-full aspect-[4/3] bg-stone-950 overflow-hidden cursor-pointer"
      >
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 p-4 text-center">
            <span className="text-4xl mb-2">🍹</span>
            <span className="text-xs font-semibold text-stone-300">{product.name}</span>
          </div>
        )}

        {/* Quiet Discount or Popular Tag */}
        {hasDiscount ? (
          <div className="absolute top-3 left-3 bg-stone-950/90 backdrop-blur-xs text-amber-400 text-[11px] font-bold px-2 py-0.5 rounded tracking-wide border border-amber-500/30">
            Save ₹{product.price - product.discount_price!}
          </div>
        ) : product.is_popular ? (
          <div className="absolute top-3 left-3 bg-emerald-700/90 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded tracking-wide border border-emerald-500/30">
            Bestseller
          </div>
        ) : null}

        {/* Rating overlay */}
        <div className="absolute top-3 right-3 bg-stone-950/85 backdrop-blur-xs px-2 py-0.5 rounded border border-stone-700/70 shadow-xs flex items-center gap-1 text-xs font-bold text-amber-300">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="tabular-nums">{product.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata unboxed text */}
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
            <span className="font-semibold text-amber-400 uppercase tracking-wider text-[11px]">
              {categoryLabel}
            </span>
            {product.calories && (
              <>
                <span aria-hidden="true" className="text-stone-600">·</span>
                <span className="tabular-nums text-stone-400">{product.calories} kcal</span>
              </>
            )}
          </div>

          <h3
            onClick={() => onSelect(product)}
            className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-amber-400 transition-colors cursor-pointer"
          >
            {product.name}
          </h3>

          <p className="text-xs text-stone-400 line-clamp-2 mt-1.5 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Actions */}
        <div className="pt-4 mt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-white tabular-nums font-mono">
                ₹{displayPrice}
              </span>
              {hasDiscount && (
                <span className="text-xs text-stone-500 line-through tabular-nums font-mono">
                  ₹{product.price}
                </span>
              )}
            </div>
            <span className="text-[11px] text-stone-400 block">350ml standard</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onQuickAdd(product)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700/80 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
              title="Add to Cart"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
            <button
              onClick={() => onBuyNow(product)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap shadow-sm hover:shadow-amber-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Buy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
