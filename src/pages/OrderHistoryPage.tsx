import React, { useState, useEffect } from 'react';
import { Package, ArrowRight, RefreshCw, Search } from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface OrderHistoryPageProps {
  onTrackOrder: (orderId: string) => void;
  onNavigate: (tab: string) => void;
}

export const OrderHistoryPage: React.FC<OrderHistoryPageProps> = ({ onTrackOrder, onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const { addToCart, openCart } = useCart();
  const { success, error: toastError } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const fetchOrders = async (emailOverride?: string, phoneOverride?: string) => {
    setLoading(true);
    try {
      const email = emailOverride || user?.email;
      const phone = phoneOverride;
      const res = await api.orders.getAll({ email, phone });
      setOrders(res.orders || []);
    } catch {
      toastError('Could not load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleGuestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(guestEmail, guestPhone);
  };

  const handleReorder = async (order: Order) => {
    try {
      const allProducts = (await api.products.getAll()).products;
      let count = 0;
      for (const item of order.items) {
        const prod = allProducts.find((p) => p.id === item.product_id);
        if (prod) {
          await addToCart(prod, {
            quantity: item.quantity,
            size: item.size,
            sugarLevel: item.sugar_level as any,
            iceLevel: item.ice_level as any,
            toppings: item.toppings,
          });
          count++;
        }
      }
      if (count > 0) {
        success('Previous items re-added to your bag!');
        openCart();
      }
    } catch {
      toastError('Failed to reorder items');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
          Order Records
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
          Your FreshSip Order History
        </h1>
        <p className="text-xs sm:text-sm text-stone-300 mt-1">
          Review previous cold-pressed beverage deliveries, reorder your favorites, or track live dispatches.
        </p>
      </div>

      {/* Guest order lookup if not logged in */}
      {!user && (
        <div className="p-5 bg-stone-900/85 backdrop-blur-xs rounded-2xl border border-stone-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wide">
              Lookup Guest Order By Phone or Email
            </h3>
            <button
              onClick={() => openAuthModal('login')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
            >
              Sign In to save order history
            </button>
          </div>
          <form onSubmit={handleGuestSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="email"
              placeholder="Email used during checkout"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
            />
            <input
              type="tel"
              placeholder="Mobile phone number"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Orders</span>
            </button>
          </form>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs text-stone-400">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-stone-900/80 rounded-3xl border border-stone-800 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-stone-950 border border-stone-800 mx-auto flex items-center justify-center text-3xl">
            📦
          </div>
          <h3 className="text-base font-bold text-white">No previous orders found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            You haven't placed an order yet. Treat yourself to pure cold-pressed natural vitality!
          </p>
          <button
            onClick={() => onNavigate('menu')}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-amber-500/20"
          >
            Explore Menu
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-5 sm:p-6 bg-stone-900/85 backdrop-blur-xs rounded-3xl border border-stone-800 shadow-xl space-y-4"
            >
              {/* Order top info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800 gap-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-sm sm:text-base font-mono">
                      #{order.order_number}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        order.order_status === 'DELIVERED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {order.order_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400 mt-0.5 block">
                    {new Date(order.created_at).toLocaleDateString()} at{' '}
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-extrabold text-base text-amber-400 tabular-nums">
                    ₹{order.grand_total}
                  </span>
                  <button
                    onClick={() => onTrackOrder(order.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                  >
                    <span>Track Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Items in order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-950 border border-stone-800 text-xs"
                  >
                    <img
                      src={item.product_image || '/src/assets/images/category_fresh_juices_1790231181678.jpg'}
                      alt={item.product_name}
                      className="w-10 h-10 rounded-lg object-cover bg-stone-900 border border-stone-800"
                    />
                    <div className="overflow-hidden">
                      <p className="font-semibold text-white truncate">{item.product_name}</p>
                      <p className="text-[11px] text-stone-400">
                        {item.quantity}x ({item.size}) · <span className="text-amber-400">₹{item.total_price}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Re-order & destination footer */}
              <div className="pt-2 flex items-center justify-between text-xs text-stone-400 border-t border-stone-800">
                <span className="truncate max-w-sm">
                  Delivered to: <strong className="text-white">{order.delivery_address.street}</strong>
                </span>

                <button
                  onClick={() => handleReorder(order)}
                  className="flex items-center gap-1 font-bold text-stone-300 hover:text-amber-400 transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Re-order Drinks</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
