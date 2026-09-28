import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  Tag,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  ShieldAlert,
  ArrowRight,
  Database,
  Upload,
  Copy,
  Check,
  RefreshCw,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import {
  Product,
  Category,
  Order,
  Coupon,
  ContactMessage,
  AdminStats,
  OrderStatus,
} from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
  uploadProductImage,
  isSupabaseConfigured,
} from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';

interface AdminPageProps {
  onNavigate: (tab: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, quickLoginAsAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'products' | 'coupons' | 'customers' | 'messages' | 'supabase'
  >('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Orders filter & search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Product Add / Edit modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    price: 150,
    discount_price: 120,
    description: '',
    ingredients: '',
    available_quantity: 50,
    status: 'active' as const,
    calories: 120,
    image: '/src/assets/images/category_fresh_juices_1790231181678.jpg',
  });

  // Coupon Add state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    title: '',
    discount_type: 'percentage' as const,
    discount_value: 20,
    min_order_value: 299,
    max_discount: 100,
  });

  // Supabase state
  const [supabaseCreds, setSupabaseCreds] = useState(getSupabaseCredentials());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseCreds.rawUrl || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(supabaseCreds.rawKey || '');
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [supabaseDiagnosticsRunning, setSupabaseDiagnosticsRunning] = useState(false);
  const [supabaseDiagnosticsLogs, setSupabaseDiagnosticsLogs] = useState<string[]>([]);
  const [copiedSchemaSql, setCopiedSchemaSql] = useState(false);
  const [productImageUploading, setProductImageUploading] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, ordersData, prodsData, catsData, coupData, custData, msgData] =
        await Promise.all([
          api.admin.getStats().catch(() => null),
          api.orders.getAll().catch(() => ({ orders: [] })),
          api.products.getAll({ limit: 100 }).catch(() => ({ products: [] })),
          api.categories.getAll().catch(() => ({ categories: [] })),
          api.coupons.getAll(true).catch(() => ({ coupons: [] })),
          api.users.getAdminCustomers().catch(() => ({ customers: [] })),
          api.contact.getAll().catch(() => ({ messages: [] })),
        ]);

      if (statsData) setStats(statsData);
      setOrders(ordersData.orders || []);
      setProducts(prodsData.products || []);
      setCategories(catsData.categories || []);
      setCoupons(coupData.coupons || []);
      setCustomers(custData.customers || []);
      setMessages(msgData.messages || []);
    } catch {
      toastError('Failed to fetch admin statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900 font-display">Administrator Access Required</h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          You are currently signed in as a customer or guest. Use the instant one-click admin test account to evaluate store management.
        </p>
        <button
          onClick={quickLoginAsAdmin}
          className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold rounded-xl text-xs transition-colors shadow-md"
        >
          Sign In as Store Administrator
        </button>
      </div>
    );
  }

  // Handle Order Status Update
  const handleOrderStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await api.orders.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      success(`Order #${res.order.order_number} marked as ${newStatus}`);
    } catch (err: any) {
      toastError(err.message || 'Failed to update order status');
    }
  };

  // Product CRUD
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        ingredients: productForm.ingredients.split(',').map((s) => s.trim()),
      };

      if (editingProductId) {
        const res = await api.products.update(editingProductId, payload);
        setProducts((prev) => prev.map((p) => (p.id === editingProductId ? res.product : p)));
        success('Product updated successfully');
      } else {
        const res = await api.products.create(payload);
        setProducts((prev) => [res.product, ...prev]);
        success('New product created');
      }
      setIsProductModalOpen(false);
      setEditingProductId(null);
    } catch (err: any) {
      toastError(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this beverage?')) return;
    try {
      await api.products.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      success('Product deleted');
    } catch (err: any) {
      toastError(err.message || 'Failed to delete product');
    }
  };

  // Coupon CRUD
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.coupons.create(couponForm);
      setCoupons((prev) => [...prev, res.coupon]);
      setIsCouponModalOpen(false);
      success('New coupon code created');
      setCouponForm({
        code: '',
        title: '',
        discount_type: 'percentage',
        discount_value: 20,
        min_order_value: 299,
        max_discount: 100,
      });
    } catch (err: any) {
      toastError(err.message || 'Failed to create coupon');
    }
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    try {
      const res = await api.coupons.update(coupon.id, { is_active: !coupon.is_active });
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? res.coupon : c)));
      success(`Coupon ${coupon.code} ${res.coupon.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      toastError('Failed to toggle coupon status');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await api.coupons.delete(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      success('Coupon deleted');
    } catch {
      toastError('Failed to delete coupon');
    }
  };

  // Supabase Handlers
  const handleTestSupabase = async () => {
    setSupabaseTesting(true);
    setSupabaseTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseTestResult(res);
      if (res.success) {
        success('Supabase database connection ping successful!');
      } else {
        toastError(res.message);
      }
    } finally {
      setSupabaseTesting(false);
    }
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      toastError('Please enter both Supabase URL and Anon Key');
      return;
    }
    if (!supabaseUrlInput.startsWith('https://')) {
      toastError('Supabase URL must start with https://');
      return;
    }
    saveSupabaseCredentials(supabaseUrlInput.trim(), supabaseKeyInput.trim());
    success('Supabase credentials saved! Refreshing...');
  };

  const handleClearSupabase = () => {
    clearSupabaseCredentials();
    setSupabaseUrlInput('');
    setSupabaseKeyInput('');
    setSupabaseTestResult(null);
    success('Supabase credentials cleared.');
  };

  const handleRunSupabaseDiagnostics = async () => {
    if (!isSupabaseConfigured()) {
      toastError('Configure Supabase credentials first');
      return;
    }

    setSupabaseDiagnosticsRunning(true);
    const logs: string[] = [];
    setSupabaseDiagnosticsLogs([]);

    const log = (msg: string) => {
      logs.push(msg);
      setSupabaseDiagnosticsLogs([...logs]);
    };

    try {
      log('1. Checking Connection Ping...');
      const ping = await testSupabaseConnection();
      log(ping.success ? '  ✓ Connection Ping Successful' : `  ✗ Connection Ping Failed: ${ping.message}`);

      log('2. Testing Categories SELECT query...');
      const cats = await supabaseService.getCategories();
      log(!cats.error ? `  ✓ Categories SELECT OK (found ${cats.categories.length})` : `  ✗ Error: ${cats.error}`);

      log('3. Testing Products SELECT query...');
      const prods = await supabaseService.getProducts();
      log(!prods.error ? `  ✓ Products SELECT OK (found ${prods.products.length})` : `  ✗ Error: ${prods.error}`);

      log('4. Testing Product INSERT operation (Phase 23)...');
      const testName = `Diagnostic Beverage #${Math.floor(Math.random() * 1000)}`;
      const insRes = await supabaseService.createProduct({
        name: testName,
        description: 'Auto-verification item',
        price: 99,
        stock_quantity: 15,
        is_available: true,
      });
      log(!insRes.error && insRes.product ? `  ✓ Product INSERT OK (ID: ${insRes.product?.id})` : `  ✗ Insert failed: ${insRes.error}`);

      if (insRes.product?.id) {
        log('5. Testing Product UPDATE operation (Phase 23)...');
        const upRes = await supabaseService.updateProduct(insRes.product.id, {
          price: 119,
          description: 'Updated diagnostic price test',
        });
        log(!upRes.error ? '  ✓ Product UPDATE OK' : `  ✗ Update failed: ${upRes.error}`);

        log('6. Testing Product DELETE operation (Phase 23)...');
        const delRes = await supabaseService.deleteProduct(insRes.product.id);
        log(delRes.success ? '  ✓ Product DELETE OK' : `  ✗ Delete failed: ${delRes.error}`);
      }

      log('7. Testing Active Offers SELECT query...');
      const offers = await supabaseService.getActiveOffers();
      log(!offers.error ? `  ✓ Offers SELECT OK (${offers.offers.length} active offers)` : `  ✗ Offers error: ${offers.error}`);

      log('8. Testing Contact Messages SELECT query...');
      const msgs = await supabaseService.getContactMessages();
      log(!msgs.error ? `  ✓ Contact Messages SELECT OK` : `  ✗ Messages error: ${msgs.error}`);

      log('All Supabase database operations verified!');
      success('Database diagnostics passed!');
    } catch (err: any) {
      log(`Diagnostic error: ${err.message}`);
      toastError(`Diagnostic error: ${err.message}`);
    } finally {
      setSupabaseDiagnosticsRunning(false);
    }
  };

  const handleCopySchemaSql = () => {
    const sqlCode = `-- FRUITSIP JUICE SHOP - SUPABASE SCHEMA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    delivery_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    customer_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5,2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public can view active offers" ON public.offers FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public can send messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
`;
    navigator.clipboard.writeText(sqlCode);
    setCopiedSchemaSql(true);
    success('Supabase SQL Schema copied to clipboard!');
    setTimeout(() => setCopiedSchemaSql(false), 3000);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProductImageUploading(true);
    try {
      const res = await uploadProductImage(file);
      if (res.error) {
        toastError(res.error);
      } else if (res.url) {
        setProductForm((prev) => ({ ...prev, image: res.url! }));
        success('Image uploaded to Supabase Storage!');
      }
    } finally {
      setProductImageUploading(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.order_status !== orderStatusFilter) return false;
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Management Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-0.5">
            FreshSip Admin Dashboard
          </h1>
        </div>

        <button
          onClick={() => onNavigate('menu')}
          className="self-start sm:self-auto px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>View Customer Storefront</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-800 scrollbar-none">
        {(
          [
            { id: 'overview', label: 'Overview & KPIs', icon: TrendingUp },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag },
            { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
            { id: 'messages', label: `Inquiries (${messages.length})`, icon: MessageSquare },
            {
              id: 'supabase',
              label: `Supabase Database (${isSupabaseConfigured() ? 'Live' : 'Setup'})`,
              icon: Database,
            },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & KPIS */}
      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-stone-900/80 rounded-2xl border border-stone-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                Total Sales
              </span>
              <p className="text-xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
                ₹{stats.totalSales}
              </p>
            </div>

            <div className="p-4 bg-stone-900/80 rounded-2xl border border-stone-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                Today's Orders
              </span>
              <p className="text-xl font-bold font-mono text-amber-300 mt-1 tabular-nums">
                {stats.todayOrders}
              </p>
            </div>

            <div className="p-4 bg-stone-900/80 rounded-2xl border border-stone-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                Pending Kitchen
              </span>
              <p className="text-xl font-bold font-mono text-rose-400 mt-1 tabular-nums">
                {stats.pendingOrders}
              </p>
            </div>

            <div className="p-4 bg-stone-900/80 rounded-2xl border border-stone-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                Delivered
              </span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                {stats.completedOrders}
              </p>
            </div>

            <div className="p-4 bg-stone-900/80 rounded-2xl border border-stone-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                Customers
              </span>
              <p className="text-xl font-bold font-mono text-stone-100 mt-1 tabular-nums">
                {stats.totalCustomers}
              </p>
            </div>

            <div className="p-4 bg-stone-900/80 rounded-2xl border border-stone-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
                Active Drinks
              </span>
              <p className="text-xl font-bold font-mono text-stone-100 mt-1 tabular-nums">
                {stats.totalProducts}
              </p>
            </div>
          </div>

          {/* Top Selling Drinks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-stone-900/80 rounded-3xl border border-stone-800 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Top Selling Beverages
              </h3>
              <div className="space-y-3">
                {stats.topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-stone-800/60 last:border-0">
                    <span className="font-semibold text-stone-200">
                      {idx + 1}. {p.name}
                    </span>
                    <div className="text-right">
                      <span className="font-bold font-mono text-amber-400 tabular-nums">
                        {p.count} bottles
                      </span>
                      <span className="text-stone-400 ml-2 font-mono tabular-nums">
                        (₹{p.revenue})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Revenue Distribution */}
            <div className="p-6 bg-stone-900/80 rounded-3xl border border-stone-800 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Category Sales Revenue
              </h3>
              <div className="space-y-3">
                {stats.categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-stone-800/60 last:border-0">
                    <span className="font-semibold text-stone-200">{c.name}</span>
                    <span className="font-bold font-mono text-emerald-400 tabular-nums">
                      ₹{c.sales}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search order #, customer name, phone..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-900 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {(['all', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      orderStatusFilter === st
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-800'
                    }`}
                  >
                    {st === 'all' ? 'All Orders' : st.replace(/_/g, ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-stone-900/80 rounded-3xl border border-stone-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950/80 border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Order Details</th>
                    <th className="p-4">Customer & Address</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="p-4 font-mono">
                        <span className="font-bold text-amber-400">#{ord.order_number}</span>
                        <span className="block text-[11px] text-stone-400 font-sans">
                          {new Date(ord.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-white block">{ord.customer_name}</span>
                        <span className="text-stone-400 block">{ord.customer_phone}</span>
                        <span className="text-[11px] text-stone-500 truncate max-w-xs block">
                          {ord.delivery_address.street}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          {ord.items.map((it) => (
                            <span key={it.id} className="block text-stone-300">
                              {it.quantity}x {it.product_name} ({it.size})
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-amber-400 tabular-nums">
                        ₹{ord.grand_total}
                      </td>

                      <td className="p-4">
                        <select
                          value={ord.order_status}
                          onChange={(e) => handleOrderStatusChange(ord.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-700 bg-stone-950 text-stone-200 font-bold text-xs focus:outline-none focus:border-amber-500"
                        >
                          <option value="PLACED">PLACED</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PREPARING">PREPARING</option>
                          <option value="READY">READY</option>
                          <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Beverage Inventory ({products.length})</h2>
            <button
              onClick={() => {
                setEditingProductId(null);
                setProductForm({
                  name: '',
                  category_id: categories[0]?.id || '',
                  price: 150,
                  discount_price: 120,
                  description: '',
                  ingredients: 'Fruit, Lemon, Mint',
                  available_quantity: 50,
                  status: 'active',
                  calories: 120,
                  image: '/src/assets/images/category_fresh_juices_1790231181678.jpg',
                });
                setIsProductModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Drink</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-stone-900/80 rounded-2xl border border-stone-800 shadow-2xs flex gap-3 justify-between"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-16 h-16 rounded-xl object-cover bg-stone-950 shrink-0 border border-stone-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs sm:text-sm text-white truncate">{p.name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        p.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">Stock: {p.available_quantity} bottles</p>
                  <p className="text-xs font-mono font-bold text-amber-400 mt-1">
                    ₹{p.discount_price ?? p.price}{' '}
                    {p.discount_price && (
                      <span className="line-through text-stone-500 text-[11px]">₹{p.price}</span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setEditingProductId(p.id);
                      setProductForm({
                        name: p.name,
                        category_id: p.category_id,
                        price: p.price,
                        discount_price: p.discount_price || p.price,
                        description: p.description,
                        ingredients: p.ingredients.join(', '),
                        available_quantity: p.available_quantity,
                        status: p.status as any,
                        calories: p.calories || 120,
                        image: p.image,
                      });
                      setIsProductModalOpen(true);
                    }}
                    className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                    title="Edit Drink"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete Drink"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: COUPONS MANAGEMENT */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Active Coupons ({coupons.length})</h2>
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="p-5 bg-stone-900/80 rounded-2xl border border-stone-800 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-amber-400 bg-stone-950 border border-stone-800 px-2.5 py-1 rounded-lg">
                    {coupon.code}
                  </span>
                  <button
                    onClick={() => handleToggleCoupon(coupon)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      coupon.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <p className="text-xs text-stone-200 font-semibold">{coupon.title}</p>
                <div className="text-[11px] text-stone-400 space-y-0.5">
                  <p>
                    Discount:{' '}
                    {coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}% (max ₹${coupon.max_discount})`
                      : `₹${coupon.discount_value}`}
                  </p>
                  <p>Min Order Value: ₹{coupon.min_order_value}</p>
                  <p>Usage: {coupon.usage_count} times</p>
                </div>

                <div className="pt-2 border-t border-stone-800 flex justify-end">
                  <button
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="text-stone-400 hover:text-rose-400 text-xs font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMERS MANAGEMENT */}
      {activeTab === 'customers' && (
        <div className="bg-stone-900/80 rounded-3xl border border-stone-800 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950/80 border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Orders Placed</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-stone-800/40">
                  <td className="p-4 font-bold text-white">{c.name}</td>
                  <td className="p-4 text-stone-300">
                    <span>{c.email}</span>
                    <span className="block text-[11px] text-stone-500">{c.phone || 'No phone'}</span>
                  </td>
                  <td className="p-4 font-mono font-bold text-amber-400 tabular-nums">
                    {c.ordersCount ?? 0}
                  </td>
                  <td className="p-4 font-mono font-bold text-amber-400 tabular-nums">
                    ₹{c.totalSpent ?? 0}
                  </td>
                  <td className="p-4 uppercase text-[10px] font-bold text-stone-400">
                    {c.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: INQUIRIES MANAGEMENT */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-xs text-stone-400 py-10 text-center">No customer inquiries yet.</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className="p-5 bg-stone-900/80 rounded-2xl border border-stone-800 shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{m.name}</span>
                    <span className="text-stone-400">({m.email} · {m.phone})</span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    {new Date(m.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-stone-300 leading-relaxed bg-stone-950/70 p-3 rounded-xl border border-stone-800">
                  {m.message}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 7: SUPABASE DATABASE & REALTIME */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          {/* Status banner */}
          <div
            className={`p-6 rounded-3xl border ${
              isSupabaseConfigured()
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isSupabaseConfigured()
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-stone-950'
                  }`}
                >
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    {isSupabaseConfigured()
                      ? 'Supabase Cloud Database Connected'
                      : 'Local Full-Stack Mode Active'}
                  </h3>
                  <p className="text-xs text-stone-300 mt-0.5">
                    {isSupabaseConfigured()
                      ? `Target Project URL: ${supabaseCreds.url}`
                      : 'FreshSip is serving requests with its local Express & JSON database. To connect your remote Supabase PostgreSQL database, configure your keys below.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSupabaseConfigured() && (
                  <button
                    onClick={handleTestSupabase}
                    disabled={supabaseTesting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${supabaseTesting ? 'animate-spin' : ''}`} />
                    <span>{supabaseTesting ? 'Testing Ping...' : 'Test Connection'}</span>
                  </button>
                )}
                <button
                  onClick={handleCopySchemaSql}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {copiedSchemaSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchemaSql ? 'Copied SQL!' : 'Copy SQL Schema (schema.sql)'}</span>
                </button>
              </div>
            </div>

            {supabaseTestResult && (
              <div
                className={`mt-4 p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                  supabaseTestResult.success
                    ? 'bg-stone-900 border-emerald-500/40 text-emerald-400'
                    : 'bg-stone-900 border-rose-500/40 text-rose-400'
                }`}
              >
                {supabaseTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{supabaseTestResult.message}</span>
              </div>
            )}
          </div>

          {/* Credentials Card */}
          <div className="p-6 bg-stone-900/80 rounded-3xl border border-stone-800 shadow-2xs space-y-4">
            <h4 className="text-sm font-bold text-white font-display">
              Supabase Project Connection Settings
            </h4>
            <form onSubmit={handleSaveSupabase} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Supabase Project URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 placeholder-stone-500 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    Supabase Publishable Anon Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 placeholder-stone-500 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-colors"
                >
                  Save & Connect Supabase
                </button>
                {isSupabaseConfigured() && (
                  <button
                    type="button"
                    onClick={handleClearSupabase}
                    className="px-4 py-2.5 border border-stone-700 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    Clear Credentials
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Phase 23: Complete Automated CRUD Diagnostics */}
          <div className="p-6 bg-stone-900/80 rounded-3xl border border-stone-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white font-display">
                  Phase 23: Database CRUD & Security Rules Diagnostic Suite
                </h4>
                <p className="text-xs text-stone-400">
                  Runs live SELECT, INSERT, UPDATE, and DELETE queries to guarantee full end-to-end functionality.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunSupabaseDiagnostics}
                disabled={supabaseDiagnosticsRunning || !isSupabaseConfigured()}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 disabled:opacity-50 text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${supabaseDiagnosticsRunning ? 'animate-spin' : ''}`} />
                <span>{supabaseDiagnosticsRunning ? 'Executing Tests...' : 'Run Diagnostics'}</span>
              </button>
            </div>

            {supabaseDiagnosticsLogs.length > 0 && (
              <div className="bg-stone-950 border border-stone-800 text-stone-200 p-4 rounded-2xl font-mono text-xs space-y-1.5 max-h-60 overflow-y-auto">
                {supabaseDiagnosticsLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes('✓')
                        ? 'text-emerald-400'
                        : log.includes('✗')
                        ? 'text-rose-400 font-bold'
                        : 'text-stone-300'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Product */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">
              {editingProductId ? 'Edit Product' : 'Add New Beverage'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-stone-300">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-stone-300">Category</label>
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-stone-300">Original Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-300">Discount Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.discount_price}
                    onChange={(e) => setProductForm({ ...productForm, discount_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-stone-300">Description</label>
                <textarea
                  rows={2}
                  required
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-stone-300">Ingredients (comma separated)</label>
                <input
                  type="text"
                  value={productForm.ingredients}
                  onChange={(e) => setProductForm({ ...productForm, ingredients: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-stone-300">Available Stock Quantity</label>
                  <input
                    type="number"
                    value={productForm.available_quantity}
                    onChange={(e) =>
                      setProductForm({ ...productForm, available_quantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-300">Status</label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Active</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Product Image & Supabase Storage Uploader */}
              <div className="space-y-2 pt-1 border-t border-stone-800">
                <label className="font-semibold block text-stone-300">Product Image</label>
                <div className="flex items-center gap-3">
                  {productForm.image && (
                    <img
                      src={productForm.image}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-stone-700 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Image URL or upload below"
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-800 bg-stone-950 text-xs font-mono text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-[11px] font-semibold transition-colors border border-stone-700">
                      <Upload className="w-3 h-3" />
                      <span>{productImageUploading ? 'Uploading to Bucket...' : 'Upload Image (Supabase Storage)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageUpload}
                        disabled={productImageUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-stone-700 text-stone-300 hover:bg-stone-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Coupon */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Coupon</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-stone-300">Coupon Code (e.g. SUMMER25)</label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 uppercase font-mono rounded-xl border border-stone-800 bg-stone-950 text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-stone-300">Title</label>
                <input
                  type="text"
                  required
                  placeholder="25% Off Weekend Chill"
                  value={couponForm.title}
                  onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-stone-300">Discount %</label>
                  <input
                    type="number"
                    value={couponForm.discount_value}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, discount_value: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-300">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={couponForm.min_order_value}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, min_order_value: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 border border-stone-700 text-stone-300 hover:bg-stone-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
