import React from 'react';
import { Home, Plus, User } from 'lucide-react';
import { translations, type Lang } from '../lib/i18n';

export type ActiveTab = 'home' | 'sell' | 'profile';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  lang: Lang;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, lang }) => {
  const t = translations[lang].nav;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 pt-1.5 pb-2.5 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
    >
      <div className="grid grid-cols-3 items-end">
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center min-h-[44px] gap-1 transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#2563EB]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-[22px] h-[22px]" strokeWidth={activeTab === 'home' ? 2.4 : 2} />
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            {t.home}
          </span>
        </button>

        <div className="flex flex-col items-center justify-center -mt-4">
          <button
            type="button"
            onClick={() => onTabChange('sell')}
            aria-label={t.sell}
            className={`flex items-center justify-center gap-1.5 px-5 h-11 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.97] text-white font-bold text-sm shadow-lg shadow-blue-600/35 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sell' ? 'ring-4 ring-blue-100' : ''
            }`}
          >
            <span className="w-5 h-5 rounded-full border-2 border-white/90 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            </span>
            <span>{t.sell}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center min-h-[44px] gap-1 transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-[#2563EB]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="w-[22px] h-[22px]" strokeWidth={activeTab === 'profile' ? 2.4 : 2} />
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            {t.profile}
          </span>
        </button>
      </div>
    </nav>
  );
};
