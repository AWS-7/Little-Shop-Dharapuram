import { useRef } from 'react';
import HeroLookbook from '../components/home/HeroLookbook';
import FlashSaleBanner from '../components/home/FlashSaleBanner';
import PolicyBanner from '../components/home/PolicyBanner';
import FeaturedGrid from '../components/home/FeaturedGrid';
import CategoryShowcase from '../components/home/CategoryShowcase';
import NewsletterSection from '../components/home/NewsletterSection';

export default function Home() {
  return (
    <div className="pt-24 md:pt-32 lg:pt-40 bg-gray-50">
      <HeroLookbook />
      <CategoryShowcase />
      <FeaturedGrid />
      <FlashSaleBanner />
      <PolicyBanner />
      <NewsletterSection />
    </div>
  );
}
