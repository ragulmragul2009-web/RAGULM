import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Minus, ShoppingBag, Zap, CheckCircle2, MessageSquare } from 'lucide-react';
import { Product, Review } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    options: {
      quantity: number;
      size: 'Small' | 'Medium' | 'Large';
      sugarLevel: 'No Sugar' | 'Less Sugar' | 'Normal Sugar';
      iceLevel: 'No Ice' | 'Less Ice' | 'Normal Ice';
      toppings: string[];
      notes: string;
    }
  ) => void;
  onBuyNow: (
    product: Product,
    options: {
      quantity: number;
      size: 'Small' | 'Medium' | 'Large';
      sugarLevel: 'No Sugar' | 'Less Sugar' | 'Normal Sugar';
      iceLevel: 'No Ice' | 'Less Ice' | 'Normal Ice';
      toppings: string[];
      notes: string;
    }
  ) => void;
}

const TOPPINGS_LIST = [
  { id: 'chia', name: 'Organic Chia Seeds', price: 20 },
  { id: 'honey', name: 'Raw Forest Honey', price: 20 },
  { id: 'nuts', name: 'Roasted Almond & Pistachio Slivers', price: 20 },
  { id: 'aloe', name: 'Fresh Aloe Vera Pulp', price: 20 },
  { id: 'protein', name: 'Plant Pea Protein Scoop (10g)', price: 40 },
];

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const { user, openAuthModal } = useAuth();
  const { success, error: toastError } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [sugarLevel, setSugarLevel] = useState<'No Sugar' | 'Less Sugar' | 'Normal Sugar'>('Normal Sugar');
  const [iceLevel, setIceLevel] = useState<'No Ice' | 'Less Ice' | 'Normal Ice'>('Normal Ice');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Reset defaults on modal open
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSize('Medium');
      setSugarLevel('Normal Sugar');
      setIceLevel('Normal Ice');
      setSelectedToppings([]);
      setNotes('');
      setActiveTab('details');

      // Fetch reviews
      setLoadingReviews(true);
      api.reviews
        .getByProduct(product.id)
        .then((res: any) => setReviews(res.reviews || []))
        .catch(() => setReviews([]))
        .finally(() => setLoadingReviews(false));
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Pricing calculation
  const basePrice = product.discount_price ?? product.price;
  let sizeMultiplier = 1;
  if (size === 'Large') sizeMultiplier = 1.35;
  if (size === 'Small') sizeMultiplier = 0.85;

  const toppingsPrice = selectedToppings.reduce((acc, tName) => {
    const item = TOPPINGS_LIST.find((t) => t.name === tName);
    return acc + (item?.price || 20);
  }, 0);

  const unitPrice = Math.round(basePrice * sizeMultiplier) + toppingsPrice;
  const totalPrice = unitPrice * quantity;

  const handleToppingToggle = (toppingName: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingName)
        ? prev.filter((t) => t !== toppingName)
        : [...prev, toppingName]
    );
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, {
      quantity,
      size,
      sugarLevel,
      iceLevel,
      toppings: selectedToppings,
      notes,
    });
    onClose();
  };

  const handleBuyNowClick = () => {
    onBuyNow(product, {
      quantity,
      size,
      sugarLevel,
      iceLevel,
      toppings: selectedToppings,
      notes,
    });
    onClose();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!newReviewText.trim() || newReviewText.trim().length < 5) {
      toastError('Please share at least a few words in your review');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.reviews.create(product.id, {
        rating: newRating,
        reviewText: newReviewText.trim(),
      });
      setReviews((prev: any[]) => [res.review, ...prev]);
      setNewReviewText('');
      success('Review posted! Thank you for sharing your experience.');
    } catch (err: any) {
      toastError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-stone-900 text-stone-100 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-800 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              {product.category?.name || 'Drink Customizer'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Top Showcase: Image + Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 relative">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-stone-950/90 backdrop-blur-xs text-amber-300 text-xs px-2.5 py-1 rounded-lg border border-stone-800">
                Freshly Prepared to Order
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display leading-tight">
                {product.name}
              </h2>

              <div className="flex items-center gap-3 my-2 text-xs text-stone-400">
                <div className="flex items-center gap-1 font-bold text-amber-300">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
                <span aria-hidden="true">·</span>
                <span>{reviews.length || product.reviews_count} verified reviews</span>
                {product.calories && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{product.calories} calories</span>
                  </>
                )}
              </div>

              <p className="text-sm text-stone-300 leading-relaxed mt-2">
                {product.description}
              </p>

              {/* Ingredients list */}
              {product.ingredients && product.ingredients.length > 0 && (
                <div className="mt-4 pt-3 border-t border-stone-800">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1.5">
                    Ingredients
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="text-xs bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/30"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-stone-800 pt-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'details' ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Drink Customizations
              {activeTab === 'details' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
                activeTab === 'reviews' ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Reviews ({reviews.length})
              {activeTab === 'reviews' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
          </div>

          {/* Tab 1: Customizations */}
          {activeTab === 'details' ? (
            <div className="space-y-6 pt-1">
              {/* Size Selector */}
              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-2">
                  Select Size
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Small', 'Medium', 'Large'] as const).map((s) => {
                    const isSelected = size === s;
                    const ml = s === 'Small' ? '250ml' : s === 'Medium' ? '350ml' : '500ml';
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold shadow-xs'
                            : 'border-stone-800 bg-stone-950/60 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <span className="block text-sm font-semibold">{s}</span>
                        <span className="block text-xs text-stone-500 mt-0.5">{ml}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sugar & Ice Levels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sugar Level */}
                <div>
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-2">
                    Sugar Preference
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {(['No Sugar', 'Less Sugar', 'Normal Sugar'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSugarLevel(lvl)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-all ${
                          sugarLevel === lvl
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-semibold'
                            : 'border-stone-800 bg-stone-950/60 text-stone-300 hover:bg-stone-800/60'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ice Level */}
                <div>
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-2">
                    Ice Preference
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {(['No Ice', 'Less Ice', 'Normal Ice'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setIceLevel(lvl)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-all ${
                          iceLevel === lvl
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-semibold'
                            : 'border-stone-800 bg-stone-950/60 text-stone-300 hover:bg-stone-800/60'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extra Toppings */}
              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-2">
                  Add-Ons & Toppings
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TOPPINGS_LIST.map((topping) => {
                    const isChecked = selectedToppings.includes(topping.name);
                    return (
                      <button
                        key={topping.id}
                        type="button"
                        onClick={() => handleToppingToggle(topping.name)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors text-xs ${
                          isChecked
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-medium'
                            : 'border-stone-800 bg-stone-950/60 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <span>{topping.name}</span>
                        <span className="font-bold text-amber-400 font-mono">+₹{topping.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Order Notes */}
              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-1">
                  Preparation Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Extra chilled, squeeze more lemon, pack straw"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950/80 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          ) : (
            /* Tab 2: Reviews */
            <div className="space-y-6 pt-1">
              {/* Submit a review */}
              <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800">
                <h4 className="text-sm font-bold text-white mb-2">Write a Verified Review</h4>
                {!user ? (
                  <p className="text-xs text-stone-400">
                    Please{' '}
                    <button
                      onClick={() => openAuthModal('login')}
                      className="text-amber-400 font-bold underline"
                    >
                      sign in
                    </button>{' '}
                    to leave a review on this fresh juice.
                  </p>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-stone-300">Your Rating:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewRating(star)}
                            className="p-1 focus:outline-none"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= newRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      placeholder="Share what you liked about the freshness, taste, and packaging..."
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 text-xs rounded-xl border border-stone-800 bg-stone-900 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {submittingReview ? 'Posting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>

              {/* Reviews list */}
              {loadingReviews ? (
                <div className="text-center py-6 text-xs text-stone-400">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-400">
                  No customer reviews yet. Be the first to try this fresh juice!
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 bg-stone-950/60 rounded-xl border border-stone-800 shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{rev.user_name}</span>
                          {rev.is_verified_purchase && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed">{rev.review_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Actions Bar */}
        <div className="px-6 py-4 bg-stone-950/90 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto gap-6">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-stone-700 rounded-xl bg-stone-900 p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg hover:bg-stone-800 flex items-center justify-center text-stone-300 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-sm font-mono tabular-nums text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg hover:bg-stone-800 flex items-center justify-center text-stone-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Total Price */}
            <div>
              <span className="text-[11px] text-stone-400 uppercase tracking-wide block">Total Price</span>
              <span className="text-xl font-bold text-amber-400 font-mono tabular-nums">
                ₹{totalPrice}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleAddToCartClick}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap border border-stone-700"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNowClick}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm"
            >
              <Zap className="w-4 h-4 fill-current" />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
