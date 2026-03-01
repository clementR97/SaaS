import { motion } from "framer-motion";
import heroImg from "@/assets/hero-wellness.jpg";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Espace bien-être zen avec pierres et eucalyptus"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <span className="inline-block font-body text-sm tracking-[0.3em] uppercase text-sage-light mb-6">
            Coach sportif · Bien-être · Naturopathie
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[1.1] text-warm-white mb-6 text-balance">
            Révélez la meilleure version de vous-même
          </h1>
          <p className="font-body text-lg md:text-xl text-sand leading-relaxed mb-10 max-w-lg">
            Une approche holistique alliant coaching sportif, madérothérapie, massages et naturopathie pour transformer votre corps et votre esprit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="default" size="lg" className="text-base px-8 py-6 rounded-full font-body font-medium">
              Prendre rendez-vous
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-full font-body font-medium border-sand/40 text-warm-white hover:bg-warm-white/10">
              Découvrir mes services
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-body text-xs tracking-widest uppercase text-sand/60">Défiler</span>
        <div className="w-px h-8 bg-sand/30" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
