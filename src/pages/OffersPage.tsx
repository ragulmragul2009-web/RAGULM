import React, { useState, useEffect } from 'react';
import { Tag, Copy, Check, Sparkles, ArrowRight } from 'lucide-react';
import { Coupon } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface OffersPageProps {
  onNavigate: (tab: string) => void;
}

export const OffersPage: React.FC<OffersPageProps> = ({ onNavigate }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { applyCoupon, openCart } = useCart();
  const { success } = useToast();

  useEffect(() => {
    api.coupons
      .getAll(false)
      .then((res) => setCoupons(res.coupons || []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleApplyToCart = async (code: string) => {
    const applied = await applyCoupon(code);
    if (applied) {
      openCart();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold tracking-wide border border-amber-500/30 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Exclusive Promotions & Deals</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
          FreshSip Rewards & Promo Codes
        </h1>
        <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl">
          Apply any of these verified coupon codes during checkout or directly add them to your active juice bag.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-stone-400">Loading active promo offers...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 text-xs text-stone-400">No active coupons at this moment.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-stone-900/85 backdrop-blur-xs rounded-3xl border border-stone-800 shadow-lg p-6 flex flex-col justify-between relative overflow-hidden group hover:border-amber-400/60 hover:shadow-amber-500/10 transition-all"
            >
              {/* Corner ribbon */}
              <div className="absolute top-0 right-0 bg-stone-950 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider border-l border-b border-stone-800">
                {coupon.discount_type === 'percentage'
                  ? `${coupon.discount_value}% OFF`
                  : `₹${coupon.discount_value} OFF`}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Special Offer
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white font-display mb-1">
                  {coupon.title}
                </h3>

                <p className="text-xs text-stone-300 leading-relaxed">
                  Get{' '}
                  {coupon.discount_type === 'percentage'
                    ? `${coupon.discount_value}% discount up to ₹${coupon.max_discount || 100}`
                    : `flat ₹${coupon.discount_value} off`}{' '}
                  on minimum order value of ₹{coupon.min_order_value}.
                </p>

                <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Valid till: {new Date(coupon.expiry_date).toLocaleDateString()}</span>
                  <span>Used {coupon.usage_count} times</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 font-mono text-xs font-bold text-amber-300">
                  <span>{coupon.code}</span>
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="p-1 text-stone-400 hover:text-white transition-colors"
                    title="Copy Code"
                  >
                    {copiedCode === coupon.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => handleApplyToCart(coupon.code)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Apply Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Free Delivery Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl border border-emerald-800/60 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold font-display text-emerald-300">Always Free Delivery Over ₹399</h4>
          <p className="text-xs text-stone-300 mt-0.5">
            No coupon needed! Simply fill your bag with cold-pressed bottles exceeding ₹399.
          </p>
        </div>
        <button
          onClick={() => onNavigate('menu')}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold whitespace-nowrap shadow-md transition-colors"
        >
          Browse Drinks
        </button>
      </div>
    </div>
  );
};
