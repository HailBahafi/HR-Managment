'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { StorefrontHeroSlide } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { HeroCarouselLayout } from '@/features/ecommerce/storefront/page-builder/domain/layout-types';
import { CarouselEngine } from '@/features/ecommerce/storefront/components/catalog/carousel-engine';
import { SectionHeader } from '@/features/ecommerce/storefront/components/catalog/section-header';
import { Link } from '@/i18n/navigation';
import { STOREFRONT_MAIN_FULL_BLEED_CLASS } from '@/features/ecommerce/storefront/components/catalog/layout-classes';
import { cn } from '@/shared/utils';

type HeroCarouselProps = {
  slides: StorefrontHeroSlide[];
  title?: string;
  subtitle?: string;
  autoplay?: boolean;
  intervalMs?: number;
  layout?: HeroCarouselLayout;
  heightRatio?: string;
};

function parseAspectRatio(heightRatio: string): string {
  const parts = heightRatio.split('/');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return `${parts[0].trim()}/${parts[1].trim()}`;
  }
  return '21/7';
}

function HeroSlideFrame({
  slide,
  layout,
  aspectRatio,
  isPriority,
}: {
  slide: StorefrontHeroSlide;
  layout: HeroCarouselLayout;
  aspectRatio: string;
  isPriority: boolean;
}) {
  const t = useTranslations('storefront');
  const alt = slide.alt || slide.title;

  return (
    <div
      className={cn(
        'relative w-full max-w-full overflow-hidden bg-muted',
        'min-h-[200px] sm:min-h-[260px] md:min-h-[320px] lg:min-h-[380px]',
        layout === 'contained' && 'rounded-2xl',
      )}
      style={{ aspectRatio }}
    >
      {slide.mobileImageUrl ? (
        <Image
          src={slide.mobileImageUrl}
          alt={alt}
          fill
          unoptimized
          priority={isPriority}
          className="object-cover md:hidden"
          sizes="(min-width: 1024px) 1400px, 100vw"
        />
      ) : null}
      <Image
        src={slide.imageUrl}
        alt={alt}
        fill
        unoptimized
        priority={isPriority}
        className={cn('object-cover', slide.mobileImageUrl && 'hidden md:block')}
        sizes="(min-width: 1024px) 1400px, 100vw"
      />

      <div className="absolute inset-0 bg-gradient-to-l from-foreground/55 via-foreground/25 to-transparent dark:from-background/70" />

      <div className="absolute inset-y-0 start-0 z-10 flex w-full max-w-xl flex-col justify-end gap-3 p-5 pb-14 sm:justify-center sm:p-8 sm:pb-8 md:p-10">
        {slide.title ? (
          <h2 className="text-balance font-arabic-display text-2xl font-bold leading-tight text-primary-foreground sm:text-3xl md:text-4xl">
            {slide.title}
          </h2>
        ) : null}
        {slide.href ? (
          <Link
            href={slide.href}
            prefetch={false}
            className="inline-flex w-fit items-center rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-elevated transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('hero.shopNow')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function HeroCarousel({
  slides,
  title,
  subtitle,
  autoplay = true,
  intervalMs = 5000,
  layout = 'contained',
  heightRatio = '21/7',
}: HeroCarouselProps) {
  const aspectRatio = parseAspectRatio(heightRatio);

  if (slides.length === 0) return null;

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-4">
      {title ? <SectionHeader title={title} subtitle={subtitle} /> : null}

      <div
        className={cn(
          'min-w-0 w-full max-w-full',
          layout === 'full-bleed' && STOREFRONT_MAIN_FULL_BLEED_CLASS,
        )}
      >
        <CarouselEngine
          itemCount={slides.length}
          autoplay={autoplay}
          intervalMs={intervalMs}
          controlsPlacement="overlay"
          className="w-full max-w-full"
          slideClassName={cn(
            'w-full max-w-full overflow-hidden',
            layout === 'contained' && 'rounded-2xl',
            layout === 'full-bleed' && 'rounded-none',
            'shadow-soft',
          )}
          renderSlide={(activeIndex) => {
            const slide = slides[activeIndex];
            if (!slide) return null;
            return (
              <HeroSlideFrame slide={slide} layout={layout} aspectRatio={aspectRatio} isPriority={activeIndex === 0} />
            );
          }}
        />
      </div>
    </div>
  );
}
