import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (tab: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-md mx-auto py-28 px-4 text-center space-y-4">
      <div className="w-20 h-20 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-4xl">
        🍉
      </div>
      <h1 className="text-3xl font-extrabold text-stone-900 font-display">404 - Page Not Found</h1>
      <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
        Oops! Looks like this page spilled away. Let’s get you back to our cold-pressed drink menu.
      </p>
      <button
        onClick={() => onNavigate('home')}
        className="px-6 py-3 bg-stone-900 hover:bg-amber-500 hover:text-stone-950 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to FreshSip Menu</span>
      </button>
    </div>
  );
};
