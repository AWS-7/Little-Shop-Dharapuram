import { useRef } from 'react';
import HeroLookbook from '../components/home/HeroLookbook';
import OffersTicker from '../components/home/OffersTicker';
import FlashSaleBanner from '../components/home/FlashSaleBanner';
import PolicyBanner from '../components/home/PolicyBanner';
import FeaturedGrid from '../components/home/FeaturedGrid';
import CategoryShowcase from '../components/home/CategoryShowcase';
import NewsletterSection from '../components/home/NewsletterSection';
import Testimonials from '../components/home/Testimonials';

export default function Home() {
  return (
    <div className="sm:-mt-5  md:-mt-20 lg:-mt-24 pb-1 bg-gray-50">
      <div className="pt-16 md:pt-20 lg:pt-24">
        <OffersTicker />
        <HeroLookbook />
        <CategoryShowcase />
        <FeaturedGrid />
        <Testimonials />
        <FlashSaleBanner />
        <PolicyBanner />
        <NewsletterSection />
      </div>
    </div>
  );
}
