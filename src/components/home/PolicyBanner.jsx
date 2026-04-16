import { motion } from 'framer-motion';
import { Truck, ShieldCheck, CreditCard, Ban } from 'lucide-react';

const policies = [
  {
    icon: Truck,
    title: 'Free Shipping',
    desc: 'On orders above ₹1,500',
  },
  {
    icon: CreditCard,
    title: 'Online Payment Only',
    desc: 'Secure digital payments',
  },
  {
    icon: Ban,
    title: 'No Returns',
    desc: 'All sales are final',
  },
  {
    icon: ShieldCheck,
    title: '100% Authentic',
    desc: 'Guaranteed genuine products',
  },
];

export default function PolicyBanner() {
  return (
    <section className="border-y border-gray-100">
      <div className="container-luxury py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {policies.map((p, idx) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <p.icon size={24} className="mx-auto text-rose-gold mb-3" strokeWidth={1.5} />
              <h4 className="font-inter text-sm font-semibold text-purple-primary mb-1">
                {p.title}
              </h4>
              <p className="font-inter text-xs text-gray-400">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
