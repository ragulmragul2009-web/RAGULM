import React, { useState } from 'react';
import { ShoppingBag, Search, User as UserIcon, Menu as MenuIcon, X, ShieldAlert, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  onSearchOpen: () => void;
  onOpenSupabaseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onNavigate, onSearchOpen, onOpenSupabaseModal }) => {
  const { user, openAuthModal, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'first', label: 'First Page' },
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'offers', label: 'Offers' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (tabId: string) => {
    onNavigate(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      {/* Top micro announcement */}
      <div className="bg-emerald-600 text-stone-950 px-4 py-1 text-center text-xs font-semibold tracking-wide">
        Free Express Cold Delivery on orders above ₹399 · Use code <span className="underline font-bold">FRESH20</span> for 20% OFF
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark with new logo */}
          <button
            onClick={() => onNavigate('first')}
            className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none"
            title="FreshSip Home"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white p-0.5 border-2 border-amber-400 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/logo.jpg"
                alt="FreshSip Logo"
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display group-hover:text-amber-400 transition-colors">
              FreshSip<span className="text-amber-500 text-sm font-normal ml-1">Juice</span>
            </span>
          </button>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-300">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative py-1 transition-colors whitespace-nowrap hover:text-white ${
                    isActive ? 'text-amber-400 font-semibold' : 'text-stone-300'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
                  )}
                </button>
              );
            })}
            {user?.role === 'admin' && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`flex items-center gap-1.5 py-1 text-xs uppercase tracking-wider font-bold transition-colors ${
                  currentTab === 'admin' ? 'text-amber-400' : 'text-amber-300/90 hover:text-amber-300'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Trigger */}
            <button
              onClick={onSearchOpen}
              className="p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-full transition-colors"
              aria-label="Search juices and smoothies"
              title="Search menu"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Shopping Bag Button */}
            <button
              onClick={openCart}
              className="relative p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-full transition-colors"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums animate-in zoom-in-50">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Supabase Database Connection Trigger */}
            {onOpenSupabaseModal && (
              <button
                onClick={onOpenSupabaseModal}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition-colors"
                title="Supabase Database Connection & CRUD Diagnostics"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-mono text-emerald-400">
                  {isSupabaseConfigured() ? 'Supabase' : 'DB'}
                </span>
              </button>
            )}

            {/* User Account / Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors text-xs font-medium border border-stone-700"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] sm:max-w-[110px] truncate">{user.name.split(' ')[0]}</span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-stone-900 border border-stone-800 rounded-xl shadow-xl py-1 z-50 text-sm text-stone-200 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-stone-800 text-xs text-stone-400">
                      Signed in as <br />
                      <strong className="text-stone-200 truncate block">{user.email}</strong>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('profile');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-stone-800 transition-colors"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('orders');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-stone-800 transition-colors"
                    >
                      Order History
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-4 py-2 text-amber-400 font-semibold hover:bg-stone-800 transition-colors"
                      >
                        Admin Dashboard
                      </button>
                    )}
                    {onOpenSupabaseModal && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenSupabaseModal();
                        }}
                        className="w-full text-left px-4 py-2 text-emerald-400 font-semibold hover:bg-stone-800 transition-colors flex items-center justify-between"
                      >
                        <span>Supabase Manager</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
                          {isSupabaseConfigured() ? 'Live' : 'Connect'}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-rose-400 hover:bg-stone-800 transition-colors border-t border-stone-800"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap shadow-sm"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-950 border-b border-stone-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                currentTab === link.id
                  ? 'bg-stone-800 text-amber-400 font-semibold'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
          {user?.role === 'admin' && (
            <button
              onClick={() => handleNavClick('admin')}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-bold text-amber-400 hover:bg-stone-800"
            >
              Admin Dashboard
            </button>
          )}
          {onOpenSupabaseModal && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSupabaseModal();
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-bold text-emerald-400 hover:bg-stone-800"
            >
              Supabase Manager ({isSupabaseConfigured() ? 'Connected' : 'Setup'})
            </button>
          )}
          {user ? (
            <>
              <button
                onClick={() => handleNavClick('profile')}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-stone-300 hover:bg-stone-800"
              >
                Profile & Addresses
              </button>
              <button
                onClick={() => handleNavClick('orders')}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-stone-300 hover:bg-stone-800"
              >
                My Orders
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-rose-400 hover:bg-stone-800"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="w-full text-center py-2.5 bg-amber-500 text-stone-950 font-bold rounded-lg text-sm"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
