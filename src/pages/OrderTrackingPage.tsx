import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Truck, Package, Utensils, AlertCircle, Phone, ArrowLeft, RefreshCw, Radio } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { supabaseService } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

interface OrderTrackingPageProps {
  orderId: string;
  onNavigate: (tab: string, param?: string) => void;
}

const STATUS_STEPS: { status: OrderStatus; label: string; icon: any; description: string }[] = [
  {
    status: 'PLACED',
    label: 'Order Placed',
    icon: Clock,
    description: 'Received at FreshSip central kitchen',
  },
  {
    status: 'CONFIRMED',
    label: 'Confirmed',
    icon: CheckCircle2,
    description: 'Farm-fresh fruits hand-inspected',
  },
  {
    status: 'PREPARING',
    label: 'Cold Pressing',
    icon: Utensils,
    description: 'Extracting juices & blending smoothies',
  },
  {
    status: 'READY',
    label: 'Thermal Packed',
    icon: Package,
    description: 'Sealed inside insulated cold pouches',
  },
  {
    status: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    icon: Truck,
    description: 'Rider speeding to your location',
  },
  {
    status: 'DELIVERED',
    label: 'Delivered Fresh',
    icon: CheckCircle2,
    description: 'Enjoy chilled nutrients & vitamins',
  },
];

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ orderId, onNavigate }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { success, error: toastError } = useToast();

  const fetchOrder = async () => {
    try {
      const res = await api.orders.getById(orderId);
      setOrder(res.order);
    } catch {
      toastError('Could not load order tracking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000); // Polling every 15s

    let unsubscribe: (() => void) | undefined;
    if (isSupabaseConfigured()) {
      unsubscribe = supabaseService.subscribeToOrderStatus(orderId, (newStatus) => {
        const normalized = newStatus.toUpperCase().replace(/\s+/g, '_') as OrderStatus;
        setOrder((prev) => (prev ? { ...prev, order_status: normalized } : prev));
        success(`Order status updated to: ${newStatus}`);
      });
    }

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, [orderId]);

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const index = STATUS_STEPS.findIndex((s) => s.status === order.order_status);
    return index > -1 ? index : 0;
  };

  const handleSimulateNextStep = async () => {
    if (!order) return;
    const currentIndex = STATUS_STEPS.findIndex((s) => s.status === order.order_status);
    if (currentIndex >= STATUS_STEPS.length - 1) {
      toastError('Order is already marked as DELIVERED');
      return;
    }

    const nextStatus = STATUS_STEPS[currentIndex + 1].status;
    setUpdating(true);
    try {
      // Allow demo advancing via admin status route
      const res = await api.orders.updateStatus(
        order.id,
        nextStatus,
        `Stage advanced to ${nextStatus} via live tracker simulation`
      );
      setOrder(res.order);
      success(`Status updated to ${nextStatus}!`);
    } catch {
      // If unauthorized (not logged in as admin), update locally for tracking simulation view
      const now = new Date().toISOString();
      const updatedOrder: Order = {
        ...order,
        order_status: nextStatus,
        updated_at: now,
        status_history: [
          ...order.status_history,
          {
            status: nextStatus,
            timestamp: now,
            note: `Status progressed to ${nextStatus}`,
          },
        ],
      };
      setOrder(updatedOrder);
      success(`Simulated order progression to ${nextStatus}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-medium">Tracking live kitchen signals...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Order Not Found</h2>
        <p className="text-xs text-stone-400">The order reference could not be located in our system.</p>
        <button
          onClick={() => onNavigate('orders')}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all"
        >
          View Order History
        </button>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <button
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white font-semibold mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Orders</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Order #{order.order_number}
            </h1>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30">
              {order.order_status.replace(/_/g, ' ')}
            </span>
            {isSupabaseConfigured() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Supabase Realtime</span>
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Live Simulation Trigger */}
        <div className="flex items-center gap-2">
          {order.order_status !== 'DELIVERED' && (
            <button
              onClick={handleSimulateNextStep}
              disabled={updating}
              className="px-4 py-2 bg-stone-900 hover:bg-amber-500 hover:text-stone-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-stone-700 disabled:opacity-50 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
              <span>Simulate Next Stage</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Step Timeline */}
      <div className="bg-stone-900/85 backdrop-blur-xs p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-xl space-y-8">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
            Live Cold Chain Tracking
          </span>
          <h2 className="text-lg font-bold text-white font-display mt-0.5">
            Estimated Delivery: Within 25-30 Minutes
          </h2>
        </div>

        {/* Desktop Horizontal Stepper */}
        <div className="hidden md:grid grid-cols-6 gap-2 relative">
          {/* Connector bar background */}
          <div className="absolute top-5 left-8 right-8 h-1 bg-stone-800 z-0" />
          <div
            className="absolute top-5 left-8 h-1 bg-emerald-500 z-0 transition-all duration-500"
            style={{ width: `${(currentStep / 5) * 85}%` }}
          />

          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;
            const Icon = step.icon;

            return (
              <div key={step.status} className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-500/20 shadow-md font-bold'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-950 text-stone-500 border border-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-xs font-bold mt-2.5 ${
                    isCurrent ? 'text-amber-400 font-extrabold' : isCompleted ? 'text-white' : 'text-stone-500'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[11px] text-stone-400 leading-tight mt-0.5 max-w-[110px]">
                  {step.description}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile Vertical Stepper */}
        <div className="md:hidden space-y-4">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;
            const Icon = step.icon;

            return (
              <div key={step.status} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-950 text-stone-500 border border-stone-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4
                    className={`text-xs font-bold ${
                      isCurrent ? 'text-amber-400' : isCompleted ? 'text-white' : 'text-stone-500'
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-[11px] text-stone-400">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Driver & Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rider card */}
        <div className="bg-stone-900/85 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wide block">
            Assigned Cold-Chain Courier
          </span>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold flex items-center justify-center text-lg">
              🛵
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Rahul Sharma</h3>
              <p className="text-xs text-stone-400">Insulated E-Bike · 4.9★ (850 drops)</p>
            </div>
          </div>
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-400">Need delivery assistance?</span>
            <a
              href="tel:+919876543210"
              className="flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Rider</span>
            </a>
          </div>
        </div>

        {/* Address Card */}
        <div className="bg-stone-900/85 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-xl space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wide block">
            Delivery Destination
          </span>
          <h3 className="font-bold text-sm text-white">{order.customer_name}</h3>
          <p className="text-xs text-stone-300 leading-relaxed">{order.delivery_address.street}</p>
          <p className="text-xs text-stone-400">
            {order.delivery_address.city}, {order.delivery_address.state} -{' '}
            {order.delivery_address.postal_code}
          </p>
          <p className="text-xs text-stone-400">Phone: {order.customer_phone}</p>
        </div>

        {/* Payment Summary */}
        <div className="bg-stone-900/85 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-xl space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wide block">
            Payment & Total
          </span>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-stone-400">Payment Mode</span>
            <span className="font-bold text-white">{order.payment_method}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">Payment Status</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                order.payment_status === 'Paid'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {order.payment_status}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm font-bold text-white pt-3 border-t border-stone-800">
            <span>Total Amount</span>
            <span className="font-mono text-base tabular-nums text-amber-400">₹{order.grand_total}</span>
          </div>
        </div>
      </div>

      {/* Ordered Items Breakdown */}
      <div className="bg-stone-900/85 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Bottles in this Cold Pack ({order.items.length})
        </h3>
        <div className="divide-y divide-stone-800">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={item.product_image || '/src/assets/images/category_fresh_juices_1790231181678.jpg'}
                  alt={item.product_name}
                  className="w-12 h-12 rounded-lg object-cover bg-stone-950 border border-stone-800"
                />
                <div>
                  <h4 className="font-bold text-white">{item.product_name}</h4>
                  <p className="text-stone-400 text-[11px]">
                    Size: {item.size} · Sugar: {item.sugar_level} · Ice: {item.ice_level}
                  </p>
                  {item.toppings && item.toppings.length > 0 && (
                    <p className="text-amber-400 text-[11px]">+ {item.toppings.join(', ')}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-white tabular-nums">
                  {item.quantity} x ₹{item.unit_price} = <span className="text-amber-400">₹{item.total_price}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
