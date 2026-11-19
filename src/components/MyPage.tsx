import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  Trash2,
  Trophy,
  User,
  UserCheck,
} from 'lucide-react';
import { formatSom, translations, type Lang } from '../lib/i18n';
import {
  isSupabaseConfigured,
  supabase,
  type MeetupRequest,
  type Product,
  type Profile,
  type UniversityCode,
} from '../lib/supabase';

interface MyPageProps {
  lang: Lang;
  profile: Profile | null;
  userProducts: Product[];
  meetupRequests: MeetupRequest[];
  onBack: () => void;
  onAuthSuccess: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSelectProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => Promise<void>;
  onUpdateMeetupStatus: (
    meetupId: string,
    status: 'accepted' | 'declined'
  ) => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const UNIVERSITIES: Array<{ code: UniversityCode; emoji: string }> = [
  { code: 'KNU', emoji: '🏛️' },
  { code: 'AUCA', emoji: '🦅' },
  { code: 'Manas University', emoji: '🐎' },
  { code: 'KRSU', emoji: '📚' },
];

export const MyPage: React.FC<MyPageProps> = ({
  lang,
  profile,
  userProducts,
  meetupRequests,
  onBack,
  onAuthSuccess,
  onSignOut,
  onSelectProduct,
  onDeleteProduct,
  onUpdateMeetupStatus,
  onNotify,
}) => {
  const t = translations[lang].auth;
  const globalT = translations[lang];

  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [nickname, setNickname] = useState('');
  const [university, setUniversity] = useState<UniversityCode>('KNU');
  const [major, setMajor] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [profileTab, setProfileTab] = useState<'listings' | 'meetups'>('listings');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg(t.supabaseMissing);
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg(lang === 'ru' ? 'Введи email и пароль.' : 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signup') {
        if (!nickname.trim() || !major.trim()) {
          setErrorMsg(
            lang === 'ru'
              ? 'Укажи имя/ник, университет и факультет с курсом.'
              : 'Please fill in your nickname, university, and major/year.'
          );
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nickname: nickname.trim(),
              university,
              major: major.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email.trim(),
            nickname: nickname.trim(),
            university,
            major: major.trim(),
            manner_temp: 98.5,
          });

          if (profileError) {
            console.warn('Profile insert warning:', profileError.message);
          }
        }

        if (data.session) {
          await onAuthSuccess();
          onNotify(
            lang === 'ru' ? 'Добро пожаловать в CampusMarket KG!' : 'Welcome to CampusMarket KG!',
            'success'
          );
        } else {
          setInfoMsg(t.checkEmailNotice);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        await onAuthSuccess();
        onNotify(
          lang === 'ru' ? 'С возвращением в кампус!' : 'Welcome back to campus!',
          'success'
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Logged-in Profile Dashboard
  if (profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-extrabold text-slate-900">{t.profilePageTitle}</h1>
          <button
            type="button"
            onClick={onSignOut}
            aria-label={t.signOut}
            className="h-9 px-3 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.signOut}</span>
          </button>
        </header>

        <div className="px-4 pt-4 space-y-4">
          {/* Student Card */}
          <section className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3.5">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-indigo-600 text-white flex items-center justify-center text-xl font-extrabold shrink-0 shadow-md shadow-blue-600/20">
                {profile.nickname.slice(0, 1).toUpperCase()}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold text-slate-900 truncate">
                  {profile.nickname}
                </h2>
                <p className="text-xs font-semibold text-[#2563EB] truncate">
                  {profile.university} · {profile.major}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{profile.email}</p>
              </div>
            </div>

            <div className="bg-blue-50/70 rounded-2xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 text-slate-800 tabular-nums">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Manner Temp: {profile.manner_temp.toFixed(1)}°C
                </span>
                <span className="text-[#2563EB]">{globalT.detail.goldStudent}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-[#2563EB] to-emerald-500" />
              </div>
            </div>
          </section>

          {/* Segmented Sub-Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-200/70">
            <button
              type="button"
              onClick={() => setProfileTab('listings')}
              className={`h-10 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                profileTab === 'listings'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>
                {t.myListings} ({userProducts.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setProfileTab('meetups')}
              className={`h-10 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                profileTab === 'meetups'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>
                {t.meetupRequests} ({meetupRequests.length})
              </span>
            </button>
          </div>

          {profileTab === 'listings' ? (
            userProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 text-xs text-slate-500">
                {t.noListings}
              </div>
            ) : (
              <div className="space-y-2.5">
                {userProducts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectProduct(item)}
                    className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-200 transition-colors"
                  >
                    <img
                      src={item.image_url}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-extrabold text-slate-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-sm font-extrabold text-[#2563EB] tabular-nums">
                        {formatSom(item.price, lang)}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{item.safe_zone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProduct(item.id);
                      }}
                      aria-label={t.deleteListing}
                      className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : meetupRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 text-xs text-slate-500">
              {t.noMeetups}
            </div>
          ) : (
            <div className="space-y-3">
              {meetupRequests.map((req) => {
                const isSeller = req.seller_id === profile.id;
                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs font-extrabold text-slate-900 truncate">
                          {req.product_title}
                        </h3>
                        <p className="text-xs font-bold text-[#2563EB] tabular-nums">
                          {formatSom(req.product_price, lang)} · {req.payment_method}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                          req.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700'
                            : req.status === 'declined'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {req.status === 'accepted'
                          ? t.statusAccepted
                          : req.status === 'declined'
                            ? t.statusDeclined
                            : t.statusPending}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                        <span>{req.safe_zone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.proposed_time}</span>
                      </div>
                      <div className="text-slate-500">
                        {isSeller
                          ? `${t.buyerLabel}: ${req.buyer_name}`
                          : `${t.sellerLabel}: ${req.seller_name}`}
                      </div>
                      {req.message && (
                        <p className="rounded-xl bg-slate-50 p-2 text-slate-700 italic">
                          “{req.message}”
                        </p>
                      )}
                    </div>

                    {isSeller && req.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onUpdateMeetupStatus(req.id, 'accepted')}
                          className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                        >
                          {t.acceptBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateMeetupStatus(req.id, 'declined')}
                          className="h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          {t.declineBtn}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Signed-out Screen 1: Student Registration & Sign In
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
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

        <h1 className="text-[15px] font-extrabold text-slate-900">
          {authMode === 'signup' ? t.pageTitle : t.loginPageTitle}
        </h1>

        <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-2xl font-extrabold text-[#2563EB] tracking-tight">
              CampusMarket KG
            </span>
            <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-[11px] font-bold">
              {globalT.cityBadge}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500">{globalT.brandSubtitle}</p>
        </div>

        {/* Face-control Hero Card */}
        <section className="rounded-2xl bg-blue-50/90 border border-blue-100 p-4 flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/25">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[14px] font-extrabold text-slate-900 mb-0.5">{t.gateTitle}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{t.gateBody}</p>
          </div>
        </section>

        {/* Two Visual Campus Showcase Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-200 shadow-xs">
            <img
              src="/images/campus-notes.svg"
              alt={t.cardLeft}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-2.5">
              <span className="text-[11.5px] font-bold text-white leading-tight">
                {t.cardLeft}
              </span>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-800 shadow-xs">
            <img
              src="/images/dorm-treasures.svg"
              alt={t.cardRight}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-2.5">
              <span className="text-[11.5px] font-bold text-white leading-tight">
                {t.cardRight}
              </span>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <section className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-4">
          {/* Segmented Mode Switch */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg(null);
              }}
              className={`h-9 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.tabSignUp}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
              }}
              className={`h-9 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.tabSignIn}
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {authMode === 'signup' && (
              <>
                {/* Nickname */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="auth-nickname"
                      className="text-xs font-extrabold text-slate-900"
                    >
                      {t.nicknameLabel}
                    </label>
                    <span className="text-[11px] text-slate-400 shrink-0">{t.nicknameHint}</span>
                  </div>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-nickname"
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={t.nicknamePlaceholder}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                {/* University Dropdown + Quick Chips */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="auth-university"
                      className="text-xs font-extrabold text-slate-900"
                    >
                      {t.campusLabel}
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />
                      {globalT.cityBadge}
                    </span>
                  </div>

                  <div className="relative mb-2">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      id="auth-university"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value as UniversityCode)}
                      className="w-full h-11 pl-10 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
                    >
                      {UNIVERSITIES.map((u) => (
                        <option key={u.code} value={u.code}>
                          {globalT.universities[u.code]} ({u.code})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {UNIVERSITIES.map((u) => {
                      const active = university === u.code;
                      return (
                        <button
                          key={u.code}
                          type="button"
                          onClick={() => setUniversity(u.code)}
                          className={`shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {u.emoji} {globalT.universitiesShort[u.code]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Major & Year */}
                <div>
                  <label
                    htmlFor="auth-major"
                    className="block text-xs font-extrabold text-slate-900 mb-1.5"
                  >
                    {t.majorLabel}
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-major"
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder={t.majorPlaceholder}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-extrabold text-slate-900 mb-1.5"
              >
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              {authMode === 'signup' && (
                <p className="text-[11px] text-slate-400 mt-1">{t.emailHelper}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-extrabold text-slate-900 mb-1.5"
              >
                {t.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {/* Safety Guarantee Callout */}
            <div className="rounded-2xl bg-blue-50/80 border border-blue-100 p-3 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-extrabold text-slate-900">{t.safetyTitle}</div>
                <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{t.safetyBody}</p>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            {infoMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
                {infoMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] disabled:opacity-60 text-white text-[13.5px] font-extrabold shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              {loading
                ? t.submitting
                : authMode === 'signup'
                  ? t.submitSignUp
                  : t.submitSignIn}
            </button>
          </form>
        </section>

        {/* Bottom Switch */}
        <div className="text-center space-y-2 pt-1">
          <p className="text-xs text-slate-500">
            {authMode === 'signup' ? t.hasAccount : t.noAccount}
          </p>
          <button
            type="button"
            onClick={() => {
              setAuthMode((prev) => (prev === 'signup' ? 'login' : 'signup'));
              setErrorMsg(null);
            }}
            className="w-full h-11 rounded-2xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-extrabold transition-colors cursor-pointer"
          >
            {authMode === 'signup' ? t.switchToSignIn : t.switchToSignUp}
          </button>
          <p className="text-[11px] text-slate-400 pt-1">{t.footerText}</p>
        </div>
      </div>
    </div>
  );
};
