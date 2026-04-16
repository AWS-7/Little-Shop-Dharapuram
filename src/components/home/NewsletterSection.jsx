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
    <section className="section-spacing bg-purple-primary/5">
      <div className="container-luxury">
        <div className="max-w-2xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-inter text-xs tracking-[0.3em] uppercase text-rose-gold mb-3"
          >
            Stay Connected
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-playfair text-3xl md:text-4xl text-purple-primary mb-4"
          >
            Join the Little Shop Circle
          </motion.h2>
          <p className="font-inter text-sm text-gray-500 mb-8">
            Be the first to know about new arrivals, exclusive offers, and curated style guides.
          </p>

          {submitted ? (
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="font-inter text-sm text-purple-primary font-medium"
            >
              Thank you for subscribing! Welcome to the circle.
            </motion.p>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 bg-white border border-gray-200 px-5 py-3 font-inter text-sm outline-none focus:border-rose-gold transition-colors"
                required
              />
              <button
                type="submit"
                className="bg-purple-primary text-white px-6 py-3 hover:bg-opacity-90 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
