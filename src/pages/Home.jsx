import { useRef } from 'react';
import HeroLookbook from '../components/home/HeroLookbook';
import FlashSaleBanner from '../components/home/FlashSaleBanner';
import PolicyBanner from '../components/home/PolicyBanner';
import FeaturedGrid from '../components/home/FeaturedGrid';
import CategoryShowcase from '../components/home/CategoryShowcase';
import NewsletterSection from '../components/home/NewsletterSection';

export default function Home() {
  const heroRef = useRef(null);

  // Trigger hero slider to advance
  const triggerHeroSlide = () => {
    // HeroLookbook will implement this via ref
    if (heroRef.current?.nextSlide) {
      heroRef.current.nextSlide();
    }
  };

  return (
    <div className="-mt-[72px] md:-mt-[88px]">
      <FlashSaleBanner triggerHeroSlide={triggerHeroSlide} />
      <HeroLookbook ref={heroRef} />
      <PolicyBanner />
      <FeaturedGrid />
      <CategoryShowcase />
      <NewsletterSection />
    </div>
  );
}
