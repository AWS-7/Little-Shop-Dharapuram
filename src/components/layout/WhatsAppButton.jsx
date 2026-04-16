import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';

const WHATSAPP_NUMBER = '919843096282'; // Client's WhatsApp number

export default function WhatsAppButton() {
  const location = useLocation();
  const { products } = useStore();
  
  // Check if we're on a product detail page
  const isProductPage = location.pathname.startsWith('/product/');
  const productId = isProductPage ? location.pathname.split('/').pop() : null;
  
  // Find current product if on product page
  const currentProduct = productId && Array.isArray(products) ? products.find(p => p.id === productId) : null;
  
  // Generate message based on context
  let message;
  if (currentProduct) {
    // On product page - product inquiry
    const productUrl = window.location.href;
    message = `Hi Little Shop, I want to know more about ${currentProduct.name} - ${productUrl}`;
  } else {
    // General inquiry
    message = 'Hi Little Shop, I have a question about your products.';
  }
  
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-36 md:bottom-8 right-4 md:right-6 z-30 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 flex items-center justify-center"
      title={currentProduct ? `Ask about ${currentProduct.name}` : 'Chat with us on WhatsApp'}
    >
      <MessageCircle size={24} fill="white" strokeWidth={0} />
      
      {/* Product indicator dot */}
      {currentProduct && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white" />
      )}
    </motion.a>
  );
}
