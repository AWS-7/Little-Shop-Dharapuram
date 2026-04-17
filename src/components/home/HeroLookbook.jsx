import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HeroLookbook = () => {
  return (
    <section className="relative w-full h-[80vh] min-h-[600px] flex items-center overflow-hidden bg-purple-light pt-16">
      <div className="container-clean grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-purple-primary/10 text-purple-primary text-xs font-bold tracking-widest uppercase mb-6">
            New Collection 2026
          </span>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-8">
            Elegance in <br />
            <span className="text-purple-primary">Every Detail.</span>
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-lg leading-relaxed">
            Discover our curated selection of premium lifestyle essentials. 
            Designed for those who appreciate quality and minimalist aesthetics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/shop" className="btn-primary text-base px-12">
              Shop Collection
            </Link>
            <Link to="/collections" className="btn-outline text-base px-12">
              View Lookbook
            </Link>
          </div>
        </motion.div>

        {/* Hero Image / Graphic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative hidden lg:block"
        >
          <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" 
              alt="Fashion Hero"
              className="w-full h-[600px] object-cover"
            />
          </div>
          {/* Decorative Elements */}
          <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-purple-primary/10 rounded-full blur-3xl -z-10" />
          <div className="absolute -top-6 -left-6 w-64 h-64 bg-purple-accent/20 rounded-full blur-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroLookbook;
