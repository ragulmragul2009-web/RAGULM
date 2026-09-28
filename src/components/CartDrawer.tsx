import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, Tag, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  onExploreMenu: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  onExploreMenu,
}) => {
  const {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    tax,
    grandTotal,
    discount,
    appliedCoupon,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [applying, setApplying] = useState(false);

  if (!isCartOpen) return null;

  const freeDeliveryThreshold = 399;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplying(true);
    await applyCoupon(couponInput.trim());
    setApplying(false);
    setCouponInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div
        className="w-full max-w-md bg-stone-900 text-stone-100 h-full shadow-2xl flex flex-col justify-between border-l border-stone-800 animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-display">
              Your Juice Bag ({itemCount})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div className="bg-amber-500/10 px-5 py-2.5 border-b border-amber-500/20 text-xs">
          {amountNeededForFreeDelivery > 0 ? (
            <p className="text-stone-300 font-medium">
              Add <span className="font-bold text-amber-400">₹{amountNeededForFreeDelivery}</span> more for{' '}
              <span className="font-bold text-emerald-400">FREE Express Delivery</span>
            </p>
          ) : (
            <p className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span>🎉</span> You unlocked FREE Express Cold Delivery!
            </p>
          )}
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${freeDeliveryProgress}%` }}
            />
          </div>
        </div>

        {/* Drawer Body - Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-800 border border-stone-700 mx-auto flex items-center justify-center text-3xl">
                🥤
              </div>
              <h3 className="text-base font-bold text-white">Your bag is empty</h3>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Cold-pressed nutrients are waiting. Explore our exotic fresh fruit juices and shakes!
              </p>
              <button
                onClick={() => {
                  closeCart();
                  onExploreMenu();
                }}
                className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Browse Fresh Menu
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-2xl border border-stone-800 bg-stone-950/60 hover:bg-stone-950/80 transition-colors"
              >
                {/* Product image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-800 shrink-0 border border-stone-700/60">
                  <img
                    src={
                      item.product?.image ||
                      '/src/assets/images/category_fresh_juices_1790231181678.jpg'
                    }
                    alt={item.product?.name || 'Drink'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-1">
                        {item.product?.name || 'Artisanal Drink'}
                      </h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-stone-400 hover:text-rose-400 p-0.5 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400 mt-0.5">
                      <span className="font-medium text-amber-300">{item.size}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.sugar_level}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.ice_level}</span>
                    </div>

                    {item.toppings && item.toppings.length > 0 && (
                      <p className="text-[11px] text-amber-400 line-clamp-1 mt-0.5">
                        +{item.toppings.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-stone-700 rounded-lg bg-stone-900">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-stone-800 text-stone-300 rounded-l"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold font-mono tabular-nums text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-stone-800 text-stone-300 rounded-r"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-amber-400">
                      ₹{item.total_price}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer - Calculations & Checkout */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950/80 space-y-3">
            {/* Coupon field */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Coupon {appliedCoupon} applied (-₹{discount})</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-stone-400 hover:text-rose-400 text-xs font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code (e.g., FRESH20)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-1.5 text-xs uppercase bg-stone-900 border border-stone-700 text-white rounded-xl focus:outline-none focus:border-amber-500 font-mono placeholder-stone-500"
                />
                <button
                  type="submit"
                  disabled={applying || !couponInput.trim()}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
              </form>
            )}

            {/* Bill breakdown */}
            <div className="space-y-1.5 text-xs text-stone-400 pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-stone-200">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Coupon Discount</span>
                  <span className="font-mono tabular-nums">-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Cold Express Delivery</span>
                <span className="font-mono tabular-nums text-stone-200">
                  {deliveryFee === 0 ? <strong className="text-emerald-400">FREE</strong> : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-mono tabular-nums text-stone-200">₹{tax}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-800 text-sm font-bold text-white">
                <span>Grand Total</span>
                <span className="font-mono tabular-nums text-base text-amber-400">₹{grandTotal}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              onClick={() => {
                closeCart();
                onProceedToCheckout();
              }}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
