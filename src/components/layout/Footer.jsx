import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Mail, Phone, MapPin, Facebook, Youtube, Twitter, Heart, ArrowUp, Sparkles } from 'lucide-react';
import { BRAND, POLICIES } from '../../lib/constants';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-16 pb-8 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Footer Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12"
        >
          {/* Brand Info */}
          <div className="lg:col-span-1 space-y-6">
            <Link to="/" className="flex flex-col group">
              <span className="text-3xl font-black italic tracking-tighter leading-none text-white group-hover:text-purple-300 transition-colors">
                LittleShop
              </span>
              <span className="text-sm font-medium italic text-gray-400 tracking-wide flex items-center gap-1">
                Explore <span className="text-purple-400 font-bold">Plus</span>
                <Sparkles className="w-3 h-3 text-yellow-400" />
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              {BRAND.description} Discover premium fashion collections crafted with love and delivered with care.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Facebook, label: 'Facebook' },
                { icon: Youtube, label: 'YouTube' },
                { icon: Twitter, label: 'Twitter' },
              ].map(({ icon: Icon, label }) => (
                <motion.a 
                  key={label}
                  href="#" 
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-purple-primary hover:text-white transition-all duration-300 group"
                  aria-label={label}
                >
                  <Icon size={18} className="text-gray-300 group-hover:text-white" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-purple-primary rounded-full" />
              Shopping
            </h4>
            <ul className="space-y-3">
              {['Shop All', 'New Arrivals', 'Collections', 'Bestsellers', 'Sale'].map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-gray-400 hover:text-purple-300 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-purple-400 transition-colors" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-purple-primary rounded-full" />
              Customer Care
            </h4>
            <ul className="space-y-3">
              {['Track Order', 'Shipping Info', 'Returns & Exchanges', 'Contact Us', 'FAQ'].map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-gray-400 hover:text-purple-300 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-purple-400 transition-colors" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-purple-primary rounded-full" />
              Contact Us
            </h4>
            <div className="space-y-4">
              <motion.a 
                href="#" 
                whileHover={{ x: 4 }}
                className="flex items-start gap-3 text-gray-400 hover:text-purple-300 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-purple-primary/20 transition-colors">
                  <MapPin size={18} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Visit Us</p>
                  <span className="text-sm">Chennai, Tamil Nadu, India</span>
                </div>
              </motion.a>
              
              <motion.a 
                href="tel:+919876543210" 
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-gray-400 hover:text-purple-300 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-purple-primary/20 transition-colors">
                  <Phone size={18} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Call Us</p>
                  <span className="text-sm">+91 98765 43210</span>
                </div>
              </motion.a>
              
              <motion.a 
                href="mailto:hello@littleshop.in" 
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-gray-400 hover:text-purple-300 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-purple-primary/20 transition-colors">
                  <Mail size={18} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email Us</p>
                  <span className="text-sm">hello@littleshop.in</span>
                </div>
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            © {new Date().getFullYear()} {BRAND.name}. Made with 
            <Heart className="w-3 h-3 text-red-500 fill-red-500" /> 
            in India. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-xs text-gray-500 hover:text-purple-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-gray-500 hover:text-purple-300 transition-colors">Terms of Service</Link>
            <Link to="/shipping" className="text-xs text-gray-500 hover:text-purple-300 transition-colors">Shipping Info</Link>
          </div>
          
          {/* Back to Top Button */}
          <motion.button
            onClick={scrollToTop}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-purple-primary/20 backdrop-blur-sm flex items-center justify-center hover:bg-purple-primary transition-all duration-300 group"
          >
            <ArrowUp size={18} className="text-purple-300 group-hover:text-white" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
