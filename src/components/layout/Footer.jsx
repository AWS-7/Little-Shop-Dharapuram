import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { BRAND, POLICIES } from '../../lib/constants';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="container-clean">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="space-y-6">
            <Link to="/" className="flex flex-col">
              <span className="text-2xl font-black italic tracking-tighter leading-none text-purple-primary">
                LittleShop
              </span>
              <span className="text-xs font-medium italic text-purple-accent tracking-wide flex items-center gap-0.5">
                Explore <span className="text-purple-primary font-bold">Plus</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs font-medium">
              {BRAND.description}
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-purple-light text-purple-primary flex items-center justify-center hover:bg-purple-primary hover:text-white transition-all duration-300">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-purple-light text-purple-primary flex items-center justify-center hover:bg-purple-primary hover:text-white transition-all duration-300">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Shopping</h4>
            <ul className="space-y-4">
              {['Shop All', 'New Arrivals', 'Collections', 'Bestsellers'].map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm text-gray-500 hover:text-purple-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Customer Care</h4>
            <ul className="space-y-4">
              {['Track Order', 'Shipping Info', 'Returns & Exchanges', 'Contact Us'].map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm text-gray-500 hover:text-purple-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm text-gray-500">
                <MapPin size={18} className="text-purple-primary shrink-0" />
                <span>Chennai, Tamil Nadu, India</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Phone size={18} className="text-purple-primary shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Mail size={18} className="text-purple-primary shrink-0" />
                <span>hello@littleshop.in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-gray-400">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-purple-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-purple-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
