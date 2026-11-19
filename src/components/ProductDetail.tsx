import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Flame,
  Gift,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { formatSom, translations, type Lang } from '../lib/i18n';
import { isSupabaseConfigured, supabase, type Product, type Profile } from '../lib/supabase';

interface ProductDetailProps {
  product: Product;
  lang: Lang;
  profile: Profile | null;
  isLiked: boolean;
  onBack: () => void;
  onToggleLike: (product: Product) => void;
  onOpenAuth: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  onMeetupCreated: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  lang,
  profile,
  isLiked,
  onBack,
  onToggleLike,
  onOpenAuth,
  onNotify,
  onMeetupCreated,
}) => {
  const t = translations[lang].detail;
  const tm = translations[lang].meetupModal;
  const safeZones = translations[lang].safeZones;

  const [showMeetupModal, setShowMeetupModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(
    lang === 'en' && product.safe_zone_en ? product.safe_zone_en : product.safe_zone
  );
  const [proposedTime, setProposedTime] = useState(
    lang === 'ru' ? 'Сегодня, 13:20 (большая перемена)' : 'Today, 13:20 (lunch break)'
  );
  const [paymentMethod, setPaymentMethod] = useState('MBank');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const title = lang === 'en' && product.title_en ? product.title_en : product.title;
  const description =
    lang === 'en' && product.description_en ? product.description_en : product.description;
  const safeZone =
    lang === 'en' && product.safe_zone_en ? product.safe_zone_en : product.safe_zone;

  const retailPrice =
    product.retail_price && product.retail_price > product.price
      ? product.retail_price
      : Math.round(product.price * 2.5);
  const savings = Math.max(0, retailPrice - product.price);
  const discountPct = retailPrice > 0 ? Math.round((savings / retailPrice) * 100) : 65;
  const shawarmaCount = Math.max(1, Math.round(savings / 230));

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
      onNotify(t.linkCopied, 'success');
    } catch {
      onNotify(t.linkCopied, 'success');
    }
  };

  const handleOpenMeetup = () => {
    setModalError(null);
    setSubmitted(false);
    setShowMeetupModal(true);
  };

  const handleSubmitMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!isSupabaseConfigured || !supabase) {
      setModalError(translations[lang].auth.supabaseMissing);
      return;
    }

    if (!profile) {
      setModalError(tm.loginRequired);
      return;
    }

    if (!proposedTime.trim()) {
      setModalError(tm.timePlaceholder);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('meetup_requests').insert({
        product_id: product.id,
        product_title: title,
        product_price: product.price,
        buyer_id: profile.id,
        buyer_name: profile.nickname,
        seller_id: product.seller_id ?? null,
        seller_name: product.seller_name,
        safe_zone: selectedZone,
        proposed_time: proposedTime.trim(),
        payment_method: paymentMethod,
        message:
          message.trim() ||
          (lang === 'ru'
            ? 'Привет! Готов встретиться и забрать в кампусе.'
            : 'Hi! Ready to meet and pick this up on campus.'),
        status: 'pending',
      });

      if (error) {
        throw error;
      }

      setSubmitted(true);
      onMeetupCreated();
      onNotify(tm.successTitle, 'success');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create meetup request';
      setModalError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-[15px] font-extrabold text-slate-900 truncate">{t.headerTitle}</h1>

        <button
          type="button"
          onClick={onOpenAuth}
          aria-label="Profile"
          className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs cursor-pointer"
        >
          {profile?.nickname ? (
            <span className="text-xs font-bold">{profile.nickname.slice(0, 1).toUpperCase()}</span>
          ) : (
            <User className="w-4 h-4" />
          )}
        </button>
      </header>

      <div className="px-4 pt-3 space-y-3.5">
        {/* Verified Strip + Share + Likes */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t.verifiedStudents}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#2563EB] cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggleLike(product)}
              className="h-9 px-3 rounded-full bg-white border border-slate-200 flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer tabular-nums"
            >
              <Heart
                className={`w-4 h-4 ${
                  isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                }`}
              />
              <span>{product.likes}</span>
            </button>
          </div>
        </div>

        {/* Product Image Showcase */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-200 aspect-[4/3] shadow-sm">
          <img
            src={product.image_url}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-slate-900/75 backdrop-blur-xs text-white px-2.5 py-1 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3 text-amber-300" />
            {t.conditionMint}
          </span>
          <span className="absolute top-3 right-3 rounded-full bg-slate-900/70 text-white px-2.5 py-1 text-[11px] font-bold tabular-nums">
            1/1
          </span>
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-xl bg-white/95 backdrop-blur-xs text-slate-900 px-2.5 py-1.5 text-[11px] font-bold shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
            {t.campusChecked}
          </span>
        </div>

        {/* Loss Aversion Savings Callout */}
        <div className="bg-blue-50/90 border border-blue-100 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white text-[#2563EB] flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[13.5px] font-extrabold text-[#1D4ED8] leading-snug mb-0.5">
              {t.saveVsRetail(formatSom(savings, lang))}
            </p>
            <p className="text-[12px] text-slate-600 leading-snug">
              {t.shawarmaCompare(shawarmaCount)}
            </p>
          </div>
        </div>

        {/* Main Title, Tags & Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
              {translations[lang].categories[
                product.category as keyof typeof translations.ru.categories
              ] || product.category}
            </span>
            {product.university && (
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#2563EB]">
                {product.university}
              </span>
            )}
          </div>

          <h2 className="text-[22px] font-extrabold text-slate-900 leading-tight tracking-tight">
            {title}
          </h2>

          <div className="flex items-baseline gap-2.5 pt-0.5">
            <span className="text-[28px] font-extrabold text-slate-900 tabular-nums">
              {formatSom(product.price, lang)}
            </span>
            <span className="text-base text-slate-400 line-through tabular-nums">
              {formatSom(retailPrice, lang)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-block rounded-lg bg-emerald-100/80 text-emerald-700 px-2.5 py-0.5 text-xs font-extrabold tabular-nums">
              {t.savePercent(discountPct)}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-2 text-xs font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
            <span>{t.viewingNow(Math.max(3, (product.views % 6) + 2))}</span>
          </div>
        </div>

        {/* Seller Card with Manner Temp 98.5°C */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-base shrink-0">
                {product.seller_name.slice(0, 1).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-2.5 h-2.5 text-[#2563EB]" />
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-[14.5px] font-extrabold text-slate-900 truncate">
                  {product.seller_name}
                </h3>
                <p className="text-xs text-slate-500 truncate">{product.seller_major}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer shrink-0"
            >
              {t.profileBtn}
            </button>
          </div>

          <div className="rounded-xl bg-emerald-50/90 border border-emerald-100 px-3 py-2 flex items-center gap-2 text-xs font-bold text-emerald-700">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t.verifiedId}</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="inline-flex items-center gap-1.5 text-slate-800 tabular-nums">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                {t.mannerTemp}: 98.5°C
              </span>
              <span className="text-[#2563EB]">{t.goldStudent}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-[#2563EB] to-emerald-500" />
            </div>
            <p className="text-[11px] text-slate-500">{t.successfulDeals}</p>
          </div>
        </section>

        {/* Story & Description */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
          <h3 className="text-[16px] font-extrabold text-slate-900">{t.storyTitle}</h3>
          <p className="text-[13.5px] leading-relaxed text-slate-700 whitespace-pre-line">
            {description}
          </p>
          <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-3 flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
            <Gift className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <span>{t.bonusTip}</span>
          </div>
        </section>

        {/* CampusShield Safe Deal */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold text-slate-900">{t.safeDealTitle}</h3>
            <span className="text-[11px] font-extrabold text-emerald-600">CampusShield™</span>
          </div>
          <div className="space-y-2.5">
            {t.safeBullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-900">{bullet.title}</div>
                  <div className="text-[11.5px] text-slate-500 leading-snug">{bullet.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Meetup Spot Map Visual */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold text-slate-900">{t.meetupSpotTitle}</h3>
            <span className="text-xs font-bold text-[#2563EB]">{product.university || 'Bishkek'}</span>
          </div>

          <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
            <svg
              viewBox="0 0 360 130"
              className="w-full h-full object-cover"
              aria-hidden="true"
            >
              <rect width="360" height="130" fill="#EFF6FF" />
              <path d="M0 36 H360 M0 88 H360 M80 0 V130 M190 0 V130 M290 0 V130" stroke="#DBEAFE" strokeWidth="6" />
              <path d="M20 115 Q160 70 340 25" stroke="#93C5FD" strokeWidth="4" fill="none" strokeDasharray="6 4" />
              <rect x="95" y="45" width="75" height="32" rx="6" fill="#FFFFFF" stroke="#BFDBFE" />
              <rect x="205" y="48" width="65" height="28" rx="6" fill="#FFFFFF" stroke="#BFDBFE" />
            </svg>
            <div className="absolute inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-md border border-slate-200 text-xs font-extrabold text-slate-900">
              <MapPin className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{safeZone}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-slate-400" />
              {t.meetupAddress}
            </span>
          </div>
        </section>
      </div>

      {/* Sticky Bottom CTA Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleOpenMeetup}
          aria-label="Message seller"
          className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleOpenMeetup}
          className="flex-1 h-12 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] text-white px-4 flex flex-col items-center justify-center shadow-lg shadow-blue-600/25 cursor-pointer transition-all"
        >
          <span className="text-[13.5px] font-extrabold leading-tight">
            {t.proposeBtn(formatSom(product.price, lang))}
          </span>
          <span className="text-[10px] text-blue-100 font-medium leading-tight">
            {t.payOnPickup}
          </span>
        </button>
      </div>

      {/* Centered Dimmed Modal Overlay: Propose Meetup / Назначить встречу */}
      {showMeetupModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowMeetupModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="meetup-modal-title"
        >
          <div
            className="w-full max-w-[398px] bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 id="meetup-modal-title" className="text-lg font-extrabold text-slate-900">
                  {tm.title}
                </h3>
                <p className="text-xs text-slate-500">{tm.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMeetupModal(false)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Item Summary */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
              <img
                src={product.image_url}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-14 h-12 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-slate-900 truncate">{title}</div>
                <div className="text-sm font-extrabold text-[#2563EB] tabular-nums">
                  {formatSom(product.price, lang)}
                </div>
              </div>
            </div>

            {submitted ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">{tm.successTitle}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{tm.successDesc}</p>
                <button
                  type="button"
                  onClick={() => setShowMeetupModal(false)}
                  className="w-full h-11 rounded-2xl bg-[#2563EB] text-white text-sm font-bold cursor-pointer"
                >
                  OK
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitMeetup} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {tm.safeZoneLabel}
                  </label>
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {!safeZones.includes(selectedZone as never) && (
                      <option value={selectedZone}>{selectedZone}</option>
                    )}
                    {safeZones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {tm.timeLabel}
                  </label>
                  <input
                    type="text"
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    placeholder={tm.timePlaceholder}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {tm.paymentLabel}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['MBank', 'O!Dengi', lang === 'ru' ? 'Наличные' : 'Cash'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`h-9 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-blue-50 border-[#2563EB] text-[#2563EB]'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {tm.messageLabel}
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={tm.messagePlaceholder}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                {modalError && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 space-y-2">
                    <p>{modalError}</p>
                    {!profile && isSupabaseConfigured && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMeetupModal(false);
                          onOpenAuth();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-bold text-xs cursor-pointer"
                      >
                        {tm.goToAuth}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowMeetupModal(false)}
                    className="h-11 px-4 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    {tm.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-11 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    {submitting ? tm.submitting : tm.submitBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
