import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, CreditCard, QrCode, Banknote, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

interface CheckoutPageProps {
  onOrderSuccess: (orderId: string) => void;
  onNavigate: (tab: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onOrderSuccess, onNavigate }) => {
  const { user, addresses } = useAuth();
  const { items, subtotal, deliveryFee, tax, grandTotal, discount, appliedCoupon } = useCart();
  const { error: toastError } = useToast();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  // Address
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('400050');
  const [notes, setNotes] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'UPI' | 'Card'>('UPI');
  const [upiId, setUpiId] = useState('freshsip@okaxis');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Sync user details if logged in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Set default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
      setStreet(def.street);
      setCity(def.city);
      setState(def.state);
      setPostalCode(def.postal_code);
    } else if (user?.address && !street) {
      setStreet(user.address);
    }
  }, [addresses, user]);

  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    const found = addresses.find((a) => a.id === addrId);
    if (found) {
      setStreet(found.street);
      setCity(found.city);
      setState(found.state);
      setPostalCode(found.postal_code);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      toastError('Please provide your name and contact phone number');
      return;
    }

    if (!street.trim()) {
      toastError('Please enter your complete delivery street address');
      return;
    }

    if (items.length === 0) {
      toastError('Your cart is empty');
      onNavigate('menu');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          instructions: notes.trim(),
        },
        paymentMethod,
        couponCode: appliedCoupon || undefined,
        notes: notes.trim(),
        items: items.map((it) => ({
          productId: it.product_id,
          productName: it.product?.name || 'Drink',
          unitPrice: it.unit_price,
          quantity: it.quantity,
          size: it.size,
          sugarLevel: it.sugar_level,
          iceLevel: it.ice_level,
          toppings: it.toppings,
        })),
      };

      const res = await api.orders.create(payload);
      onOrderSuccess(res.order.id);
    } catch (err: any) {
      toastError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Your cart is empty</h2>
        <p className="text-xs text-stone-500">Add cold-pressed drinks before checking out.</p>
        <button
          onClick={() => onNavigate('menu')}
          className="px-5 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
          Express Checkout
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
          Complete Your Order
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Columns: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Customer Contact Details */}
          <div className="bg-stone-900/85 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-extrabold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-bold text-white">Contact Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Priya Patel"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Mobile Number (for live SMS & delivery) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Email Address (for receipt & order updates)
                </label>
                <input
                  type="email"
                  placeholder="priya@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Delivery Address */}
          <div className="bg-stone-900/85 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-bold text-white">Delivery Address</h2>
            </div>

            {/* Saved Addresses for logged in users */}
            {addresses.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-stone-400 block">Select Saved Address</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectSavedAddress(addr.id)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-amber-500 bg-amber-500/15 font-medium text-white'
                          : 'border-stone-800 bg-stone-950/60 hover:bg-stone-950 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white mb-0.5">
                        <span>{addr.label}</span>
                        {addr.is_default && <span className="text-[10px] text-amber-400">Default</span>}
                      </div>
                      <p className="text-stone-300 truncate">{addr.street}</p>
                      <p className="text-stone-500 text-[11px]">
                        {addr.city}, {addr.postal_code}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Complete Street Address / Apartment / Office *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Flat 402, Sunshine Heights, Linking Road, Bandra West"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Delivery Gate Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Leave with security guard, ring doorbell twice"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Payment Method */}
          <div className="bg-stone-900/85 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-extrabold text-xs flex items-center justify-center">
                3
              </span>
              <h2 className="text-sm font-bold text-white">Payment Option</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-amber-500 bg-amber-500/15 shadow-sm'
                    : 'border-stone-800 bg-stone-950 hover:bg-stone-900'
                }`}
              >
                <QrCode className="w-5 h-5 text-amber-400 mb-2" />
                <span className="text-xs font-bold text-white">Instant UPI</span>
                <span className="text-[10px] text-stone-400">GPay, PhonePe, Paytm</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'Card'
                    ? 'border-amber-500 bg-amber-500/15 shadow-sm'
                    : 'border-stone-800 bg-stone-950 hover:bg-stone-900'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-400 mb-2" />
                <span className="text-xs font-bold text-white">Credit / Debit</span>
                <span className="text-[10px] text-stone-400">Visa, Mastercard, RuPay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Cash on Delivery')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'Cash on Delivery'
                    ? 'border-amber-500 bg-amber-500/15 shadow-sm'
                    : 'border-stone-800 bg-stone-950 hover:bg-stone-900'
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-400 mb-2" />
                <span className="text-xs font-bold text-white">Cash on Delivery</span>
                <span className="text-[10px] text-stone-400">Pay when chilled pack arrives</span>
              </button>
            </div>

            {/* Interactive Payment Fields */}
            {paymentMethod === 'UPI' && (
              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-300">Scan QR Code or enter VPA:</span>
                  <span className="font-mono text-amber-400 font-bold">UPI ID: freshsip@okaxis</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourhandle@upi"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-900 text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                  >
                    Verified
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === 'Card' && (
              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 text-xs space-y-3">
                <div>
                  <label className="text-stone-300 font-medium block mb-1">Card Number</label>
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="4111 2222 3333 4444"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-900 text-white placeholder-stone-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-stone-300 font-medium block mb-1">Expiry MM/YY</label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-900 text-white placeholder-stone-500"
                    />
                  </div>
                  <div>
                    <label className="text-stone-300 font-medium block mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={3}
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-900 text-white placeholder-stone-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Review & Submit */}
        <div className="lg:col-span-5 bg-stone-900/90 backdrop-blur-xs rounded-3xl p-6 border border-stone-800 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white font-display border-b border-stone-800 pb-3">
            Order Review ({items.length} {items.length === 1 ? 'drink' : 'drinks'})
          </h2>

          {/* Items Summary list */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white">
                    {item.quantity}x {item.product?.name || 'Beverage'}
                  </span>
                  <div className="text-[11px] text-stone-400">
                    {item.size} · {item.sugar_level}
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-400 tabular-nums">
                  ₹{item.total_price}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing calculations */}
          <div className="space-y-2 text-xs text-stone-300 border-t border-stone-800 pt-3">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="font-mono tabular-nums text-white">₹{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Coupon ({appliedCoupon})</span>
                <span className="font-mono tabular-nums">-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Cold Thermal Dispatch</span>
              <span className="font-mono tabular-nums">
                {deliveryFee === 0 ? <strong className="text-emerald-400">FREE</strong> : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxes & GST (5%)</span>
              <span className="font-mono tabular-nums text-white">₹{tax}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-stone-800 text-base font-bold text-white">
              <span>Total Payable</span>
              <span className="font-mono tabular-nums text-xl text-amber-400">₹{grandTotal}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span>Confirming with Central Kitchen...</span>
            ) : (
              <>
                <span>Place Order (₹{grandTotal})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-xs text-stone-400 justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Guaranteed 30-min cold-drop or free refuel</span>
          </div>
        </div>
      </form>
    </div>
  );
};
