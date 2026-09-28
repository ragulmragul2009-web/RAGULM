import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { SearchModal } from './components/SearchModal';
import { SupabaseConnectionModal } from './components/SupabaseConnectionModal';
import { HomePage } from './pages/HomePage';
import { FirstPage } from './pages/FirstPage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { OffersPage } from './pages/OffersPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { Product, Category } from './types';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('first');
  const [tabParam, setTabParam] = useState<string | undefined>(undefined);
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const { addToCart, openCart } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        const [prodsRes, catsRes] = await Promise.all([
          api.products.getAll(),
          api.categories.getAll(),
        ]);
        setProducts(prodsRes.products || []);
        setCategories(catsRes.categories || []);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  const handleNavigate = (tab: string, param?: string) => {
    setCurrentTab(tab);
    setTabParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleQuickAdd = (product: Product) => {
    addToCart(product, {
      quantity: 1,
      size: 'Medium',
      sugarLevel: 'Normal Sugar',
      iceLevel: 'Normal Ice',
    });
  };

  const handleBuyNow = (
    product: Product,
    options?: {
      quantity: number;
      size: 'Small' | 'Medium' | 'Large';
      sugarLevel: 'No Sugar' | 'Less Sugar' | 'Normal Sugar';
      iceLevel: 'No Ice' | 'Less Ice' | 'Normal Ice';
      toppings: string[];
      notes: string;
    }
  ) => {
    addToCart(product, options || {
      quantity: 1,
      size: 'Medium',
      sugarLevel: 'Normal Sugar',
      iceLevel: 'Normal Ice',
    });
    handleNavigate('checkout');
  };

  const handleOrderSuccess = (orderId: string) => {
    setTrackingOrderId(orderId);
    handleNavigate('track');
  };

  const handleTrackSpecificOrder = (orderId: string) => {
    setTrackingOrderId(orderId);
    handleNavigate('track');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950 relative overflow-x-hidden">
      {/* Global Signature Website Background Layer (Applied to ALL pages) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Base dark orchard atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950" />

        {/* Ambient Warm Fruit Glow Orbs */}
        <div className="absolute -top-32 left-1/4 w-[520px] h-[520px] bg-amber-500/12 rounded-full blur-[130px]" />
        <div className="absolute top-1/4 -right-24 w-[480px] h-[480px] bg-rose-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-2/3 -left-20 w-[420px] h-[420px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 right-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[140px]" />

        {/* Subtle organic radial mesh texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #f59e0b 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onSearchOpen={() => setIsSearchOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {loadingInitial ? (
          <div className="py-32 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-stone-900 border-2 border-amber-400 p-1 mx-auto shadow-xl flex items-center justify-center animate-bounce">
              <img
                src="/logo.jpg"
                alt="FreshSip"
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-base font-bold text-white font-display">
              Cold-pressing fresh orchard harvest...
            </h2>
            <p className="text-xs text-stone-400">Connecting to FreshSip Central Kitchen</p>
          </div>
        ) : (
          <>
            {currentTab === 'first' && (
              <FirstPage
                categories={categories}
                popularProducts={products.filter((p) => p.is_popular)}
                onNavigate={handleNavigate}
                onSelectProduct={handleOpenProduct}
                onQuickAdd={handleQuickAdd}
              />
            )}

            {currentTab === 'home' && (
              <HomePage
                categories={categories}
                popularProducts={products.filter((p) => p.is_popular)}
                onNavigate={handleNavigate}
                onSelectProduct={handleOpenProduct}
                onQuickAdd={handleQuickAdd}
                onBuyNow={handleBuyNow}
              />
            )}

            {currentTab === 'menu' && (
              <MenuPage
                products={products}
                categories={categories}
                initialCategory={tabParam}
                onSelectProduct={handleOpenProduct}
                onQuickAdd={handleQuickAdd}
                onBuyNow={handleBuyNow}
              />
            )}

            {currentTab === 'cart' && <CartPage onNavigate={handleNavigate} />}

            {currentTab === 'checkout' && (
              <CheckoutPage
                onOrderSuccess={handleOrderSuccess}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'track' && (
              <OrderTrackingPage
                orderId={trackingOrderId || 'ord_1001'}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'orders' && (
              <OrderHistoryPage
                onTrackOrder={handleTrackSpecificOrder}
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'profile' && <UserProfilePage />}

            {currentTab === 'offers' && <OffersPage onNavigate={handleNavigate} />}

            {currentTab === 'about' && <AboutPage onNavigate={handleNavigate} />}

            {currentTab === 'contact' && <ContactPage />}

            {currentTab === 'admin' && <AdminPage onNavigate={handleNavigate} />}

            {![
              'first',
              'home',
              'menu',
              'cart',
              'checkout',
              'track',
              'orders',
              'profile',
              'offers',
              'about',
              'contact',
              'admin',
            ].includes(currentTab) && <NotFoundPage onNavigate={handleNavigate} />}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Global Product Customizer Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onAddToCart={(product, opts) => addToCart(product, opts)}
        onBuyNow={handleBuyNow}
      />

      {/* Global Slide-Over Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => handleNavigate('checkout')}
        onExploreMenu={() => handleNavigate('menu')}
      />

      {/* Global Authentication Modal */}
      <AuthModal />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={handleOpenProduct}
        onNavigateToMenuWithQuery={(q) => {
          handleNavigate('menu');
          // small delay to let MenuPage mount with query
          setTimeout(() => {
            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (input) {
              input.value = q;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }, 100);
        }}
      />

      {/* Supabase Connection & Diagnostics Modal */}
      <SupabaseConnectionModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
