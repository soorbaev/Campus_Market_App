import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { translations, type Lang } from '../lib/i18n';

interface PromoCarouselProps {
  lang: Lang;
  onActionClick?: () => void;
}

const SLIDE_GRADIENTS = [
  'from-[#2563EB] via-[#1D4ED8] to-[#1E40AF]',
  'from-[#1E40AF] via-[#2563EB] to-[#0284C7]',
  'from-[#0F766E] via-[#0D9488] to-[#2563EB]',
];

export const PromoCarousel: React.FC<PromoCarouselProps> = ({ lang, onActionClick }) => {
  const slides = translations[lang].carousel;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [isPaused, slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null) {
      if (touchDeltaX.current < -40) {
        setActiveIndex((prev) => (prev + 1) % slides.length);
      } else if (touchDeltaX.current > 40) {
        setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
    setIsPaused(false);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-md shadow-blue-600/15 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="CampusMarket promotions"
    >
      <div
        className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide, idx) => (
          <div
            key={idx}
            onClick={onActionClick}
            className={`w-full shrink-0 bg-gradient-to-br ${SLIDE_GRADIENTS[idx]} p-4 text-white cursor-pointer`}
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase backdrop-blur-xs">
                {slide.badge}
              </span>
              <span className="text-[11px] font-semibold text-white/80 tabular-nums">
                {idx + 1} / {slides.length}
              </span>
            </div>

            <h2 className="text-[19px] font-extrabold leading-tight tracking-tight mb-1.5">
              {slide.title}
            </h2>
            <p className="text-[12.5px] leading-relaxed text-blue-50/95 mb-3.5 line-clamp-2">
              {slide.body}
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/95">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                {slide.footer}
              </span>
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {slides.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setActiveIndex(dotIdx)}
                    aria-label={`Slide ${dotIdx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeIndex === dotIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/65'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
