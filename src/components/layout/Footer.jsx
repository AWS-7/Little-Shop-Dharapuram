import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { BRAND, POLICIES } from '../../lib/constants';

export default function Footer() {
  return (
    <footer className="bg-purple-secondary text-white/90">
      <div className="container-luxury py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-playfair text-2xl font-semibold text-white mb-4">
              {BRAND.name}
            </h3>
            <p className="font-inter text-sm text-white/60 leading-relaxed">
              {BRAND.description}
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-inter text-xs tracking-[0.2em] uppercase text-white/40 mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {['Shop All', 'New Arrivals', 'Collections', 'About Us'].map((link) => (
                <li key={link}>
                  <Link
                    to={`/${link.toLowerCase().replace(/\s+/g, '-')}`}
                    className="font-inter text-sm text-white/70 hover:text-rose-gold transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-inter text-xs tracking-[0.2em] uppercase text-white/40 mb-6">Customer Care</h4>
            <ul className="space-y-3">
              {['Track Order', 'Shipping Info', 'FAQ', 'Contact Us'].map((link) => (
                <li key={link}>
                  <Link
                    to={`/${link.toLowerCase().replace(/\s+/g, '-')}`}
                    className="font-inter text-sm text-white/70 hover:text-rose-gold transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies + Contact */}
          <div>
            <h4 className="font-inter text-xs tracking-[0.2em] uppercase text-white/40 mb-6">Policies</h4>
            <div className="space-y-3 mb-6">
              <p className="font-inter text-sm text-rose-gold font-medium">{POLICIES.payment}</p>
              <p className="font-inter text-sm text-rose-gold font-medium">{POLICIES.returns}</p>
            </div>
            <div className="space-y-2 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <span>hello@littleshop.in</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5" />
                <span>Chennai, Tamil Nadu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-inter text-xs text-white/40">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <p className="font-inter text-xs text-white/40">
            Crafted with love in India
          </p>
        </div>
      </div>
    </footer>
  );
}
