import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Upload,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
  uploadProductImage,
  isSupabaseConfigured,
} from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { useToast } from '../context/ToastContext';

interface SupabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConnectionModal: React.FC<SupabaseConnectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { success, error: toastError } = useToast();
  const [creds, setCreds] = useState(getSupabaseCredentials());
  const [urlInput, setUrlInput] = useState(creds.rawUrl || '');
  const [keyInput, setKeyInput] = useState(creds.rawKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Diagnostic suite results
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    connection?: boolean;
    categoriesSelect?: boolean;
    productsSelect?: boolean;
    productInsert?: boolean;
    productUpdate?: boolean;
    productDelete?: boolean;
    reviewsSelect?: boolean;
    contactSelect?: boolean;
    offersSelect?: boolean;
    storageBucket?: boolean;
    logs: string[];
  }>({ logs: [] });

  // Storage upload test
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const c = getSupabaseCredentials();
      setCreds(c);
      setUrlInput(c.rawUrl || '');
      setKeyInput(c.rawKey || '');
      if (c.isConfigured) {
        handleQuickTest();
      }
    }
  }, [isOpen]);

  const handleQuickTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success) {
        success('Supabase connected successfully!');
      } else {
        toastError(res.message);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      toastError('Please enter both Supabase URL and Anon Key');
      return;
    }
    if (!urlInput.startsWith('https://')) {
      toastError('Supabase URL must start with https://');
      return;
    }
    saveSupabaseCredentials(urlInput.trim(), keyInput.trim());
    success('Supabase credentials saved! Reloading...');
  };

  const handleClear = () => {
    clearSupabaseCredentials();
    setUrlInput('');
    setKeyInput('');
    setTestResult(null);
    success('Credentials reset to local defaults');
  };

  // Run full database testing suite (Phase 23)
  const runFullDiagnostics = async () => {
    if (!isSupabaseConfigured()) {
      toastError('Please configure Supabase URL and Anon Key first');
      return;
    }

    setDiagnosticsRunning(true);
    const logs: string[] = [];
    const results: any = { logs };

    try {
      logs.push('1. Testing initial connection...');
      const conn = await testSupabaseConnection();
      results.connection = conn.success;
      logs.push(conn.success ? '  ✓ Connection ping passed' : `  ✗ Connection error: ${conn.message}`);

      logs.push('2. Testing Categories SELECT...');
      const cats = await supabaseService.getCategories();
      results.categoriesSelect = !cats.error;
      logs.push(!cats.error ? `  ✓ Categories SELECT OK (found ${cats.categories.length})` : `  ✗ Error: ${cats.error}`);

      logs.push('3. Testing Products SELECT...');
      const prods = await supabaseService.getProducts();
      results.productsSelect = !prods.error;
      logs.push(!prods.error ? `  ✓ Products SELECT OK (found ${prods.products.length})` : `  ✗ Error: ${prods.error}`);

      logs.push('4. Testing Product INSERT (Phase 23)...');
      const testProdName = `Diagnostic Juice Test #${Date.now().toString().slice(-4)}`;
      const insertRes = await supabaseService.createProduct({
        name: testProdName,
        description: 'Auto-test verification juice item',
        price: 99,
        stock_quantity: 10,
        is_available: true,
      });
      results.productInsert = !insertRes.error && !!insertRes.product;
      logs.push(results.productInsert ? `  ✓ Product INSERT OK (ID: ${insertRes.product?.id})` : `  ✗ Insert failed: ${insertRes.error}`);

      if (insertRes.product?.id) {
        logs.push('5. Testing Product UPDATE (Phase 23)...');
        const updateRes = await supabaseService.updateProduct(insertRes.product.id, {
          price: 109,
          description: 'Updated diagnostic price test',
        });
        results.productUpdate = !updateRes.error;
        logs.push(!updateRes.error ? '  ✓ Product UPDATE OK' : `  ✗ Update failed: ${updateRes.error}`);

        logs.push('6. Testing Product DELETE (Phase 23)...');
        const delRes = await supabaseService.deleteProduct(insertRes.product.id);
        results.productDelete = delRes.success;
        logs.push(delRes.success ? '  ✓ Product DELETE OK' : `  ✗ Delete failed: ${delRes.error}`);
      }

      logs.push('7. Testing Active Offers SELECT...');
      const offers = await supabaseService.getActiveOffers();
      results.offersSelect = !offers.error;
      logs.push(!offers.error ? `  ✓ Offers SELECT OK (${offers.offers.length} active offers)` : `  ✗ Offers error: ${offers.error}`);

      logs.push('8. Testing Contact Messages SELECT...');
      const msgs = await supabaseService.getContactMessages();
      results.contactSelect = !msgs.error;
      logs.push(!msgs.error ? `  ✓ Contact Messages SELECT OK` : `  ✗ Messages error: ${msgs.error}`);

      logs.push('Diagnostic run completed!');
      success('Database diagnostics complete!');
    } catch (err: any) {
      logs.push(`Critical diagnostic failure: ${err.message}`);
      toastError(`Diagnostic error: ${err.message}`);
    } finally {
      setDiagnostics({ ...results, logs });
      setDiagnosticsRunning(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadProductImage(file);
      if (res.error) {
        toastError(res.error);
      } else if (res.url) {
        setUploadedUrl(res.url);
        success('Image uploaded to Supabase Storage!');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCopySql = () => {
    const sqlCode = `-- FRUITSIP JUICE SHOP - SUPABASE SCHEMA
-- Open Supabase Dashboard > SQL Editor and Run this:
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
    setCopiedSql(true);
    success('SQL schema copied to clipboard! Paste into Supabase SQL Editor.');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 font-display">
                Supabase Database Manager
              </h3>
              <p className="text-xs text-stone-500">
                Connect your PostgreSQL Supabase instance to FreshSip
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Banner */}
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${
            creds.isConfigured
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {creds.isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                {creds.isConfigured ? '🟢 Supabase Configured' : '🟡 Local Fallback Mode Active'}
              </div>
              <div className="text-xs opacity-90 truncate max-w-md">
                {creds.isConfigured
                  ? `Host: ${creds.url}`
                  : 'Running on integrated full-stack Node/JSON database. Enter your Supabase credentials below to connect your remote database.'}
              </div>
            </div>
          </div>
          {creds.isConfigured && (
            <button
              onClick={handleQuickTest}
              disabled={isTesting}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Ping'}</span>
            </button>
          )}
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-start gap-2 border ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Supabase Project URL (VITE_SUPABASE_URL)
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Supabase Anon Key (VITE_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Never expose service_role secrets. Only use the public publishable anon key.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-stone-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Save & Connect
            </button>
            {creds.isConfigured && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl text-xs font-bold transition-colors"
              >
                Clear Credentials
              </button>
            )}
            <button
              type="button"
              onClick={handleCopySql}
              className="ml-auto px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema (schema.sql)'}</span>
            </button>
          </div>
        </form>

        {/* Phase 23: Complete Diagnostic Test Runner */}
        <div className="border-t border-stone-100 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Full Database CRUD & RLS Verification Suite (Phase 23)
              </h4>
              <p className="text-[11px] text-stone-500">
                Tests SELECT, INSERT, UPDATE, DELETE, and Policies on your live Supabase database
              </p>
            </div>
            <button
              type="button"
              onClick={runFullDiagnostics}
              disabled={diagnosticsRunning || !creds.isConfigured}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${diagnosticsRunning ? 'animate-spin' : ''}`} />
              <span>{diagnosticsRunning ? 'Running Tests...' : 'Run Diagnostics'}</span>
            </button>
          </div>

          {diagnostics.logs.length > 0 && (
            <div className="bg-stone-950 text-stone-200 p-3.5 rounded-2xl font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto">
              {diagnostics.logs.map((log, idx) => (
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

        {/* Phase 12: Image Storage Bucket Upload Test */}
        <div className="border-t border-stone-100 pt-5 space-y-3">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Supabase Storage Upload Test (Bucket: product-images)
          </h4>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer px-4 py-2 border border-dashed border-stone-300 hover:border-amber-500 rounded-xl text-xs font-medium text-stone-700 bg-stone-50 hover:bg-amber-50/50 flex items-center gap-2 transition-colors">
              <Upload className="w-4 h-4 text-stone-500" />
              <span>{uploadingImage ? 'Uploading to Bucket...' : 'Upload Image to Supabase'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage || !creds.isConfigured}
                className="hidden"
              />
            </label>
            {uploadedUrl && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <a
                  href={uploadedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline flex items-center gap-1 hover:text-emerald-800"
                >
                  <span>View Uploaded Image</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
