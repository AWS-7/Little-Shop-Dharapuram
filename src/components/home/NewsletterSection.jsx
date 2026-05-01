import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Gift, Crown } from 'lucide-react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          {/* Elegant Card */}
          <div className="bg-white p-8 md:p-12 shadow-xl border border-gray-100 rounded-2xl text-center relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              {/* Title with Double Line Diamond Underline */}
              <div className="relative inline-block mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-wide text-center">
                  Join Our VIP Circle
                </h2>
                {/* Double Lines with Center Diamond */}
                <div className="mt-4 flex items-center justify-center gap-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: 50 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                    className="h-0.5 bg-gradient-to-r from-transparent to-purple-primary rounded-full"
                  />
                  <motion.div
                    initial={{ scale: 0, rotate: 0 }}
                    whileInView={{ scale: 1, rotate: 45 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
                    className="w-2.5 h-2.5 bg-purple-primary rotate-45 shadow-lg shadow-purple-primary/40"
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: 50 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                    className="h-0.5 bg-gradient-to-l from-transparent to-purple-primary rounded-full"
                  />
                </div>
              </div>
              
              {/* Benefits */}
              <div className="flex justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 text-gray-500">
                  <Gift className="w-4 h-4 text-purple-primary" />
                  <span className="text-sm">Exclusive Offers</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Crown className="w-4 h-4 text-purple-primary" />
                  <span className="text-sm">Early Access</span>
                </div>
              </div>

              {submitted ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-green-50 text-green-700 p-6 rounded-xl font-bold border border-green-100 inline-block"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Welcome to the circle! Check your inbox soon.
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full bg-gray-50 border border-gray-200 pl-12 pr-6 py-4 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 transition-all text-sm font-medium"
                      required
                    />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-purple-primary text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-purple-secondary transition-all shadow-lg shadow-purple-primary/30 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Subscribe
                  </motion.button>
                </form>
              )}
              
              <p className="mt-6 text-xs text-gray-400">
                By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
