import React, { useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  Lightbulb,
  MapPin,
  ShieldCheck,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { formatSom, translations, type Lang } from '../lib/i18n';
import {
  isSupabaseConfigured,
  supabase,
  type CategoryKey,
  type ConditionKey,
  type Profile,
} from '../lib/supabase';

interface SellItemFlowProps {
  lang: Lang;
  profile: Profile | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onPublished: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const SELL_CATEGORIES: Array<{ key: Exclude<CategoryKey, 'All'>; emoji: string }> = [
  { key: 'Textbooks', emoji: '📚' },
  { key: 'Electronics', emoji: '💻' },
  { key: 'Dorm/Living', emoji: '☕' },
  { key: 'Clothing', emoji: '👕' },
];

export const SellItemFlow: React.FC<SellItemFlowProps> = ({
  lang,
  profile,
  onClose,
  onOpenAuth,
  onPublished,
  onNotify,
}) => {
  const t = translations[lang].sell;
  const catLabels = translations[lang].categories;
  const safeZones = translations[lang].safeZones;

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Exclude<CategoryKey, 'All'>>('Textbooks');
  const [priceStr, setPriceStr] = useState('1200');
  const [condition, setCondition] = useState<ConditionKey>('mint');
  const [safeZone, setSafeZone] = useState<string>(safeZones[0]);
  const [description, setDescription] = useState('');
  const [studentsOnly, setStudentsOnly] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numericPrice = Math.max(0, parseInt(priceStr.replace(/\D/g, ''), 10) || 0);
  const shawarmaCount = Math.max(1, Math.round(numericPrice / 200));

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg(translations[lang].auth.supabaseMissing);
      return;
    }

    if (!profile) {
      setErrorMsg(t.needAuthBody);
      return;
    }

    if (!photoFile) {
      setErrorMsg(t.validationPhoto);
      return;
    }

    if (!title.trim()) {
      setErrorMsg(t.validationTitle);
      return;
    }

    if (numericPrice <= 0) {
      setErrorMsg(t.validationPrice);
      return;
    }

    setSubmitting(true);
    try {
      const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, photoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: insertError } = await supabase.from('products').insert({
        seller_id: profile.id,
        title: title.trim(),
        price: numericPrice,
        retail_price: Math.round(numericPrice * 2.2),
        category,
        university: profile.university || 'KNU',
        condition,
        safe_zone: safeZone,
        description: description.trim(),
        image_url: publicUrl,
        seller_name: profile.nickname,
        seller_major: `${profile.major} · ${profile.university}`,
        students_only: studentsOnly,
        likes: 0,
        views: 1,
      });

      if (insertError) {
        throw insertError;
      }

      onNotify(t.publishSuccess, 'success');
      onPublished();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload or publish error';
      setErrorMsg(msg);
      onNotify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-[15px] font-extrabold text-slate-900 leading-tight">
            {t.headerTitle}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">{t.headerSub}</p>
        </div>

        <span className="rounded-full bg-blue-50 text-[#2563EB] px-2.5 py-1 text-[11px] font-bold">
          {t.draftBadge}
        </span>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pt-3.5 space-y-4">
        {/* Auth Prompt Banner if not logged in */}
        {!profile && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-amber-900">{t.needAuthTitle}</div>
              <div className="text-[11px] text-amber-800 leading-snug">{t.needAuthBody}</div>
            </div>
            <button
              type="button"
              onClick={onOpenAuth}
              className="shrink-0 px-3 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold cursor-pointer"
            >
              {t.needAuthBtn}
            </button>
          </div>
        )}

        {/* Persuasion Blue Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] p-4 text-white shadow-md shadow-blue-600/15">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-[15px] font-extrabold leading-snug mb-1">{t.bannerTitle}</h2>
              <p className="text-[12px] leading-relaxed text-blue-50/95">{t.bannerBody}</p>
            </div>
          </div>
        </div>

        {/* Photo Upload Card */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-extrabold text-slate-900">{t.photoTitle}</h3>
            <span className="text-xs font-bold text-[#2563EB] tabular-nums">
              {photoPreview ? '1 / 1' : '0 / 1'}
            </span>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelected}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            className="hidden"
          />

          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/95 text-slate-800 text-xs font-bold shadow-sm cursor-pointer"
                >
                  {t.changePhoto}
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  aria-label={t.removePhoto}
                  className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 text-center space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
                <ImagePlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{t.photoPrompt}</p>
                <p className="text-[11.5px] text-slate-500 mt-0.5">{t.photoSub}</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.fromCamera}</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>{t.fromGallery}</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {t.angleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 flex items-center gap-2 text-[11.5px] font-semibold text-emerald-700">
            <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t.photoTip}</span>
          </div>
        </section>

        {/* Item Title */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="sell-title" className="text-[13.5px] font-extrabold text-slate-900">
              {t.whatSelling}
            </label>
            <span className="text-[11px] text-slate-400">{t.whatSellingHint}</span>
          </div>
          <input
            id="sell-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.titlePlaceholder}
            maxLength={90}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </section>

        {/* Category 2x2 Grid */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2.5">
          <h3 className="text-[13.5px] font-extrabold text-slate-900">{t.categoryTitle}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {SELL_CATEGORIES.map((cat) => {
              const active = category === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`h-11 px-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    active
                      ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:border-blue-300'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="truncate">{catLabels[cat.key]}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Price in KGS + Shawarma Converter */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2.5">
          <h3 className="text-[13.5px] font-extrabold text-slate-900">{t.priceTitle}</h3>
          <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-200">
            <div className="flex items-baseline gap-2 flex-1 min-w-0">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                aria-label={t.priceTitle}
                className="w-28 bg-transparent text-2xl font-extrabold text-[#2563EB] focus:outline-none tabular-nums"
              />
              <span className="text-base font-extrabold text-slate-900">сом</span>
            </div>
            <span className="rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
              {t.fairTrade}
            </span>
          </div>

          <div className="rounded-xl bg-blue-50/70 px-3 py-2 text-xs font-medium text-slate-700 tabular-nums">
            🌯 {t.shawarmaCalc(shawarmaCount, formatSom(numericPrice, lang))}
          </div>
        </section>

        {/* Condition Selector */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13.5px] font-extrabold text-slate-900">{t.conditionTitle}</h3>
            <span className="text-[11px] text-slate-400">{t.conditionHint}</span>
          </div>
          <div className="space-y-2">
            {t.conditions.map((item) => {
              const selected = condition === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCondition(item.key as ConditionKey)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                    selected
                      ? 'bg-blue-50/70 border-[#2563EB]'
                      : 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected ? 'border-[#2563EB]' : 'border-slate-300'
                      }`}
                    >
                      {selected && <span className="w-2 h-2 rounded-full bg-[#2563EB]" />}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">{item.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{item.note}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Safe Zone Dropdown */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[13.5px] font-extrabold text-slate-900">{t.safeZoneTitle}</h3>
            <span className="text-[11px] font-bold text-emerald-600">{t.securityBadge}</span>
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={safeZone}
              onChange={(e) => setSafeZone(e.target.value)}
              className="w-full h-11 pl-9 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
            >
              {safeZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </section>

        {/* Description */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2">
          <h3 className="text-[13.5px] font-extrabold text-slate-900">{t.descriptionTitle}</h3>
          <textarea
            rows={4}
            maxLength={400}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
            className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{t.descriptionHint}</span>
            <span className="tabular-nums">{description.length} / 400</span>
          </div>
        </section>

        {/* Verified Students Only Toggle */}
        <section className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-slate-900">{t.studentsOnlyToggle}</div>
              <div className="text-[11px] text-slate-500 leading-snug">
                {t.studentsOnlyToggleSub}
              </div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={studentsOnly}
            onClick={() => setStudentsOnly((v) => !v)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer ${
              studentsOnly ? 'bg-[#2563EB]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                studentsOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </section>

        {/* Safety Note */}
        <div className="rounded-2xl bg-slate-100/90 p-3.5 flex items-start gap-2.5 text-[11.5px] text-slate-600 leading-relaxed">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{t.safetyNote}</span>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Submit CTA */}
        <div className="space-y-2.5 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-13 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] disabled:opacity-60 text-white text-[15px] font-extrabold shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            {submitting ? t.publishing : t.publishBtn}
          </button>
          <p className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{t.footerNote}</span>
          </p>
        </div>
      </form>
    </div>
  );
};
