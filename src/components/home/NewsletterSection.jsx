import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

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
    <section className="section-spacing bg-white">
      <div className="container-clean">
        <div className="bg-purple-primary rounded-3xl p-10 md:p-20 text-center relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-accent/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

          <div className="max-w-2xl mx-auto relative z-10">
            <span className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
              Exclusive Access
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Join our VIP List
            </h2>
            <p className="text-white/70 text-base md:text-lg mb-10 leading-relaxed">
              Get early access to new collections, secret sales, and 
              exclusive events. No spam, just pure inspiration.
            </p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white font-bold inline-block border border-white/20"
              >
                Welcome to the inner circle! Check your inbox soon.
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-white/10 border border-white/20 px-6 py-4 rounded-xl text-white placeholder:text-white/40 outline-none focus:bg-white/20 focus:border-white/40 transition-all text-sm font-medium"
                  required
                />
                <button
                  type="submit"
                  className="bg-white text-purple-primary px-10 py-4 rounded-xl font-bold text-sm hover:bg-purple-light transition-all shadow-lg active:scale-95"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
