import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

interface FooterProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const { success, error } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      error('Please enter a valid email address');
      return;
    }
    success('Subscribed! 10% coupon code FRESHWELCOME sent to your inbox.');
    setEmail('');
  };

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white p-0.5 border-2 border-amber-400 shadow-sm flex items-center justify-center shrink-0">
                <img
                  src="/logo.jpg"
                  alt="FreshSip Logo"
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white font-display">
                FreshSip<span className="text-amber-500 text-sm font-normal ml-1">Juice</span>
              </span>
            </div>
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              100% cold-pressed raw fruit juices, thick artisanal shakes, and wholesome antioxidant smoothies.
              Never pasteurized, zero added refined sugar, cold-delivered in under 30 minutes.
            </p>
            <div className="text-xs text-stone-400 space-y-1">
              <p>📍 Central Kitchen & Juice Bar, Mumbai 400050</p>
              <p>⏰ Open Everyday: 7:00 AM – 11:00 PM</p>
              <p>📞 +91 98765 43210 · hello@freshsip.com</p>
            </div>
          </div>

          {/* Menu Categories */}
          <div>
            <h3 className="text-xs font-semibold text-stone-200 uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('menu', 'cat_fresh_juices')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Fresh Juices
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('menu', 'cat_fruit_shakes')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Fruit Shakes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('menu', 'cat_smoothies')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Smoothies
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('menu', 'cat_milkshakes')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Milkshakes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('menu', 'cat_mocktails')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Mocktails
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('menu', 'cat_healthy_drinks')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Healthy Cleanse
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-stone-200 uppercase tracking-wider mb-4">Explore</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate('first')} className="hover:text-amber-400 transition-colors">
                  First Page (Welcome)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-amber-400 transition-colors">
                  Juice Shop Front
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('offers')} className="hover:text-amber-400 transition-colors">
                  Coupons & Offers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-amber-400 transition-colors">
                  Our Cold-Press Story
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-amber-400 transition-colors">
                  Contact & Bulk Orders
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('orders')} className="hover:text-amber-400 transition-colors">
                  Track Existing Order
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div>
            <h3 className="text-xs font-semibold text-stone-200 uppercase tracking-wider mb-4">
              Get 10% Off
            </h3>
            <p className="text-xs text-stone-400 mb-3 leading-relaxed">
              Subscribe for weekly detox recipe secrets and exclusive secret menu drop alerts.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition-colors"
              >
                Claim 10% Coupon
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} FreshSip Juice Shop. All rights reserved. 100% Raw & Natural.</p>
          <div className="flex items-center gap-6">
            <span>FSSAI Certified Food Establishment</span>
            <span aria-hidden="true">·</span>
            <span>Temperature-Controlled Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
