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
    <section className="py-12 md:py-20 bg-gray-50">
      <div className="container-clean">
        <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100 rounded-sm text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">
              Join Our VIP Circle
            </h2>
            <p className="text-gray-500 text-sm md:text-base font-medium mb-8">
              Get early access to new collections and exclusive offers.
            </p>

            {submitted ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-sm font-bold border border-green-100 inline-block">
                Welcome to the circle! Check your inbox soon.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-gray-50 border border-gray-200 px-6 py-3 rounded-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-purple-primary transition-all text-sm font-bold"
                  required
                />
                <button
                  type="submit"
                  className="bg-purple-primary text-white px-8 py-3 rounded-sm font-black text-xs uppercase tracking-widest hover:bg-purple-secondary transition-all shadow-md"
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
