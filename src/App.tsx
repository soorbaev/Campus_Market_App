import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { BottomNav, type ActiveTab } from './components/BottomNav';
import { HomeFeed } from './components/HomeFeed';
import { MyPage } from './components/MyPage';
import { ProductDetail } from './components/ProductDetail';
import { SellItemFlow } from './components/SellItemFlow';
import { SEED_PRODUCTS } from './data/seedProducts';
import type { Lang } from './lib/i18n';
import {
  isSupabaseConfigured,
  supabase,
  type MeetupRequest,
  type Product,
  type Profile,
} from './lib/supabase';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const [lang, setLang] = useState<Lang>('ru');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(isSupabaseConfigured);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meetupRequests, setMeetupRequests] = useState<MeetupRequest[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setProducts(SEED_PRODUCTS);
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Products fetch error:', error.message);
        setProducts(SEED_PRODUCTS);
      } else if (data && data.length > 0) {
        setProducts(data as Product[]);
      } else {
        // Show 4 realistic Bishkek campus seed cards if the table is empty
        setProducts(SEED_PRODUCTS);
      }
    } catch {
      setProducts(SEED_PRODUCTS);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchMeetups = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    const { data, error } = await supabase
      .from('meetup_requests')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMeetupRequests(data as MeetupRequest[]);
    }
  }, []);

  const loadUserProfile = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setProfile(null);
      setMeetupRequests([]);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) {
      setProfile(null);
      setMeetupRequests([]);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData as Profile);
    } else {
      const meta = user.user_metadata || {};
      const fallbackProfile: Profile = {
        id: user.id,
        email: user.email || '',
        nickname: (meta.nickname as string) || user.email?.split('@')[0] || 'Student',
        university: (meta.university as string) || 'KNU',
        major: (meta.major as string) || 'Student',
        manner_temp: 98.5,
      };
      await supabase.from('profiles').upsert(fallbackProfile);
      setProfile(fallbackProfile);
    }

    await fetchMeetups(user.id);
  }, [fetchMeetups]);

  useEffect(() => {
    fetchProducts();
    loadUserProfile();

    if (!isSupabaseConfigured || !supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUserProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProducts, loadUserProfile]);

  const handleToggleLike = async (product: Product) => {
    const alreadyLiked = likedIds.has(product.id);
    const delta = alreadyLiked ? -1 : 1;
    const nextLikes = Math.max(0, (product.likes || 0) + delta);

    setLikedIds((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) next.delete(product.id);
      else next.add(product.id);
      return next;
    });

    setProducts((prev) =>
      prev.map((item) => (item.id === product.id ? { ...item, likes: nextLikes } : item))
    );

    if (selectedProduct?.id === product.id) {
      setSelectedProduct((prev) => (prev ? { ...prev, likes: nextLikes } : null));
    }

    if (!product.is_seed && isSupabaseConfigured && supabase) {
      await supabase.from('products').update({ likes: nextLikes }).eq('id', product.id);
    }
  };

  const handleSelectProduct = async (product: Product) => {
    const nextViews = (product.views || 0) + 1;
    const updatedProduct = { ...product, views: nextViews };
    setSelectedProduct(updatedProduct);
    setProducts((prev) =>
      prev.map((item) => (item.id === product.id ? updatedProduct : item))
    );

    if (!product.is_seed && isSupabaseConfigured && supabase) {
      await supabase.from('products').update({ views: nextViews }).eq('id', product.id);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setProfile(null);
    setMeetupRequests([]);
    notify(lang === 'ru' ? 'Ты вышел из аккаунта.' : 'Signed out.', 'success');
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      notify(error.message, 'error');
      return;
    }
    setProducts((prev) => prev.filter((item) => item.id !== productId));
    notify(lang === 'ru' ? 'Объявление удалено' : 'Listing removed', 'success');
  };

  const handleUpdateMeetupStatus = async (
    meetupId: string,
    status: 'accepted' | 'declined'
  ) => {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase
      .from('meetup_requests')
      .update({ status })
      .eq('id', meetupId);
    if (error) {
      notify(error.message, 'error');
      return;
    }
    setMeetupRequests((prev) =>
      prev.map((m) => (m.id === meetupId ? { ...m, status } : m))
    );
    notify(
      status === 'accepted'
        ? lang === 'ru'
          ? 'Встреча подтверждена!'
          : 'Meetup accepted!'
        : lang === 'ru'
          ? 'Заявка отклонена'
          : 'Meetup declined',
      'success'
    );
  };

  const userProducts = useMemo(() => {
    if (!profile) return [];
    return products.filter((p) => p.seller_id === profile.id);
  }, [products, profile]);

  const handleTabChange = (tab: ActiveTab) => {
    setSelectedProduct(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      {/* Centered Mobile Viewport Container (max-w 430px on desktop, full width on mobile) */}
      <main className="w-full max-w-[430px] min-h-screen bg-[#F8FAFC] relative shadow-2xl shadow-slate-900/10 sm:border-x sm:border-slate-200/80">
        {selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            lang={lang}
            profile={profile}
            isLiked={likedIds.has(selectedProduct.id)}
            onBack={() => setSelectedProduct(null)}
            onToggleLike={handleToggleLike}
            onOpenAuth={() => {
              setSelectedProduct(null);
              setActiveTab('profile');
            }}
            onNotify={notify}
            onMeetupCreated={() => {
              if (profile) fetchMeetups(profile.id);
            }}
          />
        ) : activeTab === 'sell' ? (
          <SellItemFlow
            lang={lang}
            profile={profile}
            onClose={() => setActiveTab('home')}
            onOpenAuth={() => setActiveTab('profile')}
            onPublished={async () => {
              await fetchProducts();
              setActiveTab('home');
            }}
            onNotify={notify}
          />
        ) : activeTab === 'profile' ? (
          <MyPage
            lang={lang}
            profile={profile}
            userProducts={userProducts}
            meetupRequests={meetupRequests}
            onBack={() => setActiveTab('home')}
            onAuthSuccess={loadUserProfile}
            onSignOut={handleSignOut}
            onSelectProduct={(item) => handleSelectProduct(item)}
            onDeleteProduct={handleDeleteProduct}
            onUpdateMeetupStatus={handleUpdateMeetupStatus}
            onNotify={notify}
          />
        ) : (
          <HomeFeed
            lang={lang}
            onToggleLang={() => setLang((prev) => (prev === 'ru' ? 'en' : 'ru'))}
            products={products}
            loading={loadingProducts}
            profile={profile}
            likedIds={likedIds}
            onToggleLike={handleToggleLike}
            onSelectProduct={handleSelectProduct}
            onOpenSell={() => setActiveTab('sell')}
            onOpenProfile={() => setActiveTab('profile')}
          />
        )}

        {/* Fixed 3-Tab Bottom Navigation Bar (hidden on Product Detail where Sticky Meetup CTA sits) */}
        {!selectedProduct && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} lang={lang} />
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[390px] pointer-events-none">
            <div
              className={`rounded-2xl px-4 py-3 shadow-xl border flex items-center gap-2.5 text-xs font-bold backdrop-blur-md ${
                toast.type === 'error'
                  ? 'bg-rose-950/95 text-white border-rose-800'
                  : 'bg-slate-900/95 text-white border-slate-700'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
