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
    <section className="bg-white border-y border-gray-100">
      <div className="container-clean py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {policies.map((p, idx) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-light flex items-center justify-center shrink-0">
                <p.icon size={22} className="text-purple-primary" strokeWidth={2} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">
                  {p.title}
                </h4>
                <p className="text-xs font-medium text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
