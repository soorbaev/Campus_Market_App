import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronDown,
  Eye,
  Heart,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { formatSomShort, translations, type Lang } from '../lib/i18n';
import type { CategoryKey, Product, Profile } from '../lib/supabase';
import { PromoCarousel } from './PromoCarousel';

interface HomeFeedProps {
  lang: Lang;
  onToggleLang: () => void;
  products: Product[];
  loading: boolean;
  profile: Profile | null;
  likedIds: Set<string>;
  onToggleLike: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onOpenSell: () => void;
  onOpenProfile: () => void;
}

const CATEGORIES: Array<{ key: CategoryKey; emoji: string }> = [
  { key: 'All', emoji: '' },
  { key: 'Textbooks', emoji: '📚' },
  { key: 'Electronics', emoji: '💻' },
  { key: 'Dorm/Living', emoji: '☕' },
  { key: 'Clothing', emoji: '👕' },
];

type UniversityFilter = 'ALL' | 'KNU' | 'AUCA' | 'Manas University' | 'KRSU';
type SortMode = 'newest' | 'price_asc' | 'popular';

export const HomeFeed: React.FC<HomeFeedProps> = ({
  lang,
  onToggleLang,
  products,
  loading,
  profile,
  likedIds,
  onToggleLike,
  onSelectProduct,
  onOpenSell,
  onOpenProfile,
}) => {
  const t = translations[lang];
  const [universityFilter, setUniversityFilter] = useState<UniversityFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentsOnly, setStudentsOnly] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((item) => {
      if (studentsOnly && item.students_only === false) return false;
      if (universityFilter !== 'ALL' && item.university !== universityFilter) {
        return false;
      }
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          item.title,
          item.title_en ?? '',
          item.description,
          item.description_en ?? '',
          item.safe_zone,
          item.safe_zone_en ?? '',
          item.seller_name,
          item.category,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortMode === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortMode === 'popular') {
      sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    return sorted;
  }, [products, studentsOnly, universityFilter, categoryFilter, searchQuery, sortMode]);

  const cycleSortMode = () => {
    setSortMode((prev) =>
      prev === 'newest' ? 'price_asc' : prev === 'price_asc' ? 'popular' : 'newest'
    );
  };

  const displayName = profile?.nickname
    ? profile.nickname.split(' ')[0]
    : t.home.guestName;

  return (
    <div className="pb-24">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 pt-3 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" strokeWidth={2.3} />
            </div>
            <span className="text-[17px] font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              {t.brand}
            </span>
            <span className="rounded-md bg-[#2563EB] px-1.5 py-0.5 text-[10px] font-extrabold text-white tracking-wide shrink-0">
              KG
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleLang}
              aria-label="Switch language"
              className="h-9 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <span className={lang === 'ru' ? 'text-[#2563EB]' : 'text-slate-400'}>RU</span>
              <span className="text-slate-300">|</span>
              <span className={lang === 'en' ? 'text-[#2563EB]' : 'text-slate-400'}>EN</span>
            </button>

            <button
              type="button"
              onClick={onOpenProfile}
              aria-label={t.nav.profile}
              className="w-9 h-9 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center shadow-sm shadow-blue-600/25 transition-colors cursor-pointer"
            >
              {profile?.nickname ? (
                <span className="text-xs font-bold">
                  {profile.nickname.slice(0, 1).toUpperCase()}
                </span>
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Sub-row: University Filter Dropdown + 100% Student Verified Badge */}
        <div className="flex items-center justify-between gap-2 mt-2.5">
          <div className="relative">
            <select
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value as UniversityFilter)}
              aria-label="Filter by university"
              className="appearance-none bg-slate-100 hover:bg-slate-200/75 text-slate-800 text-xs font-bold pl-3 pr-7 py-1.5 rounded-full border border-slate-200/70 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">{t.allUniversities}</option>
              <option value="KNU">{t.universities.KNU}</option>
              <option value="AUCA">{t.universities.AUCA}</option>
              <option value="Manas University">{t.universities['Manas University']}</option>
              <option value="KRSU">{t.universities.KRSU}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            {t.verifiedBadge}
          </span>
        </div>
      </header>

      <div className="px-4 pt-3.5 space-y-3.5">
        {/* Greeting Card */}
        <section className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center text-lg shrink-0">
              👋
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-extrabold text-slate-900 truncate">
                {t.home.greeting} {displayName}!
              </h1>
              <p className="text-xs text-slate-500 truncate">{t.home.greetingSub}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSell}
            className="shrink-0 px-3 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            {t.home.sellBtn.replace('+ ', '')}
          </button>
        </section>

        {/* Real-time Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.home.searchPlaceholder}
            className="w-full h-11 pl-10 pr-9 rounded-2xl bg-white border border-slate-200/80 text-[13.5px] text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3-Slide Touch-Swipeable Carousel */}
        <PromoCarousel lang={lang} onActionClick={onOpenSell} />

        {/* Horizontal Scrollable Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIES.map((cat) => {
            const isActive = categoryFilter === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategoryFilter(cat.key)}
                className={`shrink-0 h-9 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/25'
                    : 'bg-white text-slate-700 border border-slate-200/90 hover:border-blue-300'
                }`}
              >
                {cat.emoji && <span>{cat.emoji}</span>}
                <span>{t.categories[cat.key]}</span>
              </button>
            );
          })}
        </div>

        {/* Verified Students Only Toggle Card */}
        <div className="bg-white rounded-2xl px-3.5 py-2.5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-slate-900 truncate">
                {t.home.studentsOnlyTitle}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {t.home.studentsOnlySub}
              </div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={studentsOnly}
            onClick={() => setStudentsOnly((v) => !v)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
              studentsOnly ? 'bg-[#2563EB]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                studentsOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Deals Section Header */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <h2 className="text-[13px] font-extrabold tracking-wide text-slate-900 truncate">
              {t.home.dealsTitle}
            </h2>
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
              {t.home.dealsSub}
            </span>
          </div>

          <button
            type="button"
            onClick={cycleSortMode}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#2563EB] bg-white border border-slate-200/80 rounded-lg px-2 py-1 cursor-pointer shrink-0"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>
              {sortMode === 'newest'
                ? t.home.sortNewest
                : sortMode === 'price_asc'
                  ? t.home.sortPriceAsc
                  : t.home.sortPopular}
            </span>
          </button>
        </div>

        {/* 2-Column Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((skeleton) => (
              <div
                key={skeleton}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 p-2.5 animate-pulse"
              >
                <div className="aspect-[4/3] bg-slate-200 rounded-xl mb-2.5" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
                <div className="h-5 bg-blue-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-100">
            <p className="text-sm font-bold text-slate-800 mb-1">{t.home.emptyTitle}</p>
            <p className="text-xs text-slate-500 mb-3.5">{t.home.emptySub}</p>
            <button
              type="button"
              onClick={() => {
                setUniversityFilter('ALL');
                setCategoryFilter('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-blue-50 text-[#2563EB] text-xs font-bold hover:bg-blue-100 cursor-pointer"
            >
              {t.home.resetFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((item) => {
              const title = lang === 'en' && item.title_en ? item.title_en : item.title;
              const subtitle =
                lang === 'en' && item.subtitle_en
                  ? item.subtitle_en
                  : item.subtitle || item.seller_major;
              const badgeText = lang === 'en' && item.badge_en ? item.badge_en : item.badge;
              const safeZone =
                lang === 'en' && item.safe_zone_en ? item.safe_zone_en : item.safe_zone;
              const isLiked = likedIds.has(item.id);

              return (
                <article
                  key={item.id}
                  onClick={() => onSelectProduct(item)}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xs hover:shadow-md hover:border-blue-100 transition-all cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    {badgeText && (
                      <span className="absolute top-2 left-2 max-w-[75%] truncate rounded-full bg-white/95 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-xs">
                        {badgeText}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(item);
                      }}
                      aria-label="Like item"
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[13px] font-extrabold text-slate-900 leading-snug line-clamp-2 mb-0.5">
                        {title}
                      </h3>
                      <p className="text-[11px] font-medium text-emerald-600 truncate mb-2">
                        {subtitle}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
                        <span className="text-[16px] font-extrabold text-[#2563EB] tabular-nums">
                          {formatSomShort(item.price, lang)}
                        </span>
                        {item.retail_price && item.retail_price > item.price && (
                          <span className="text-[11px] text-slate-400 line-through tabular-nums">
                            {formatSomShort(item.retail_price, lang)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10.5px] font-medium text-slate-500 mb-2">
                        <MapPin className="w-3 h-3 text-[#2563EB] shrink-0" />
                        <span className="truncate">{safeZone}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10.5px] text-slate-400 font-medium tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {item.views}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {item.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Safe Exchange Zone Bottom Card */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[13.5px] font-extrabold text-slate-900 mb-1">
              {t.home.safeZoneTitle}
            </h3>
            <p className="text-[12px] leading-relaxed text-slate-500">
              {t.home.safeZoneBody}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
