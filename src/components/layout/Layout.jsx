import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import WhatsAppButton from './WhatsAppButton';
import RecentlyViewed from '../home/RecentlyViewed';
import CartDrawer from '../cart/CartDrawer';
import CartSync from '../CartSync';
import useStore from '../../store/useStore';

export default function Layout() {
  const location = useLocation();
  const { cartDrawerOpen, closeCartDrawer } = useStore();
  const isProductPage = location.pathname.startsWith('/product/');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-14 md:pt-[88px] pb-24 lg:pb-0">
        <Outlet />
        {/* Only show Recently Viewed on Product Detail pages */}
        {isProductPage && <RecentlyViewed />}
      </main>
      <Footer />
      <MobileNav />
      <CartDrawer isOpen={cartDrawerOpen} onClose={closeCartDrawer} />
      <WhatsAppButton />
      <CartSync />
    </div>
  );
}
