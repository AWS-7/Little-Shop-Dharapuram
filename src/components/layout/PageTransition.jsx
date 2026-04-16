import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Page transition wrapper - smooth fade + slide effect
export default function PageTransition({ children }) {
  const location = useLocation();
  
  const pageVariants = {
    initial: { 
      opacity: 0, 
      y: 10,
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1], // Smooth ease-out
      }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: {
        duration: 0.3,
        ease: 'easeIn',
      }
    }
  };

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}

// Logo Pulse Loading Component - for slow data fetches
export function LogoPulse({ show = false }) {
  if (!show) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm"
    >
      <div className="text-center">
        {/* Logo Text with pulse animation */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <h1 className="font-playfair text-3xl md:text-4xl text-purple-primary">
            Little Shop
          </h1>
        </motion.div>
        
        {/* Subtle loading line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="h-0.5 bg-rose-gold/50 mt-4 rounded-full"
          style={{ maxWidth: '120px', margin: '16px auto 0' }}
        />
        
        <p className="font-inter text-xs text-gray-400 mt-3 tracking-wider uppercase">
          Loading
        </p>
      </div>
    </motion.div>
  );
}
