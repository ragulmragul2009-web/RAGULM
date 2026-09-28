import React, { useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, Tag, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    tax,
    grandTotal,
    discount,
    appliedCoupon,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setLoadingCoupon(true);
    await applyCoupon(couponCode.trim());
    setLoadingCoupon(false);
    setCouponCode('');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-stone-900 border border-stone-800 text-amber-400 mx-auto flex items-center justify-center text-4xl shadow-md">
          🥤
        </div>
        <h1 className="text-2xl font-bold text-white font-display">Your Cart is Empty</h1>
        <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
          You haven't added any fresh cold-pressed elixirs to your bag yet.
        </p>
        <button
          onClick={() => onNavigate('menu')}
          className="mt-4 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-sm shadow-md hover:shadow-amber-500/20 transition-all"
        >
          Explore Fresh Juices & Shakes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div>
          <button
            onClick={() => onNavigate('menu')}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white font-semibold mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-400 hover:text-rose-300"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-2xl bg-stone-900/85 backdrop-blur-xs border border-stone-800 shadow-lg flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
            >
              <div className="flex items-center gap-4">
                <img
                  src={
                    item.product?.image ||
                    '/src/assets/images/category_fresh_juices_1790231181678.jpg'
                  }
                  alt={item.product?.name || 'Beverage'}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-xl object-cover bg-stone-950 shrink-0 border border-stone-800"
                />
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    {item.product?.name || 'Handcrafted Juice'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400 mt-1">
                    <span className="font-semibold text-amber-400">{item.size}</span>
                    <span aria-hidden="true" className="text-stone-600">·</span>
                    <span>{item.sugar_level}</span>
                    <span aria-hidden="true" className="text-stone-600">·</span>
                    <span>{item.ice_level}</span>
                  </div>
                  {item.toppings && item.toppings.length > 0 && (
                    <p className="text-xs text-amber-300 mt-1">
                      Toppings: {item.toppings.join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-stone-400 italic mt-0.5">Note: {item.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800">
                <span className="text-base sm:text-lg font-bold font-mono text-white tabular-nums">
                  ₹{item.total_price}
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-stone-700 rounded-lg bg-stone-950">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-stone-800 text-stone-400 hover:text-white rounded-l"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-mono tabular-nums text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-stone-800 text-stone-400 hover:text-white rounded-r"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-400 rounded-md transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4 bg-stone-900/90 backdrop-blur-xs rounded-3xl p-6 border border-stone-800 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white font-display border-b border-stone-800 pb-3">
            Bill Details
          </h2>

          {/* Coupon Code Entry */}
          <div>
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wide block mb-1.5">
              Have a Promo Code?
            </label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-950/80 border border-emerald-800 px-3 py-2.5 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                  <Tag className="w-4 h-4" />
                  <span>{appliedCoupon} (-₹{discount})</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-stone-400 hover:text-rose-400 font-bold text-xs"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Code (e.g. FRESH20)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 text-xs uppercase bg-stone-950 border border-stone-800 rounded-xl focus:outline-none focus:border-amber-400 font-mono text-white placeholder-stone-500"
                />
                <button
                  type="submit"
                  disabled={loadingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* Breakdown items */}
          <div className="space-y-2.5 text-xs text-stone-300 pt-2 border-t border-stone-800">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="font-mono tabular-nums text-white">₹{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Coupon Savings</span>
                <span className="font-mono tabular-nums">-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Cold Thermal Delivery</span>
              <span className="font-mono tabular-nums">
                {deliveryFee === 0 ? <strong className="text-emerald-400">FREE</strong> : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>GST & Taxes (5%)</span>
              <span className="font-mono tabular-nums text-white">₹{tax}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-stone-800 text-base font-bold text-white">
              <span>To Pay</span>
              <span className="font-mono tabular-nums text-lg text-amber-400">₹{grandTotal}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('checkout')}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-xs text-stone-400 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure 256-bit checkout encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};
