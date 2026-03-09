import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-16 sm:py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-sage-light flex items-center justify-center">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-4 sm:mb-6">
            Une approche globale du bien-être
          </h2>
          <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
            Passionné(e) par le corps humain et ses capacités de transformation, je vous accompagne avec une méthode personnalisée qui prend en compte l'ensemble de votre être : physique, mental et émotionnel.
          </p>
          <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed">
            Mon approche holistique combine l'activité physique, les soins corporels naturels et l'équilibre nutritionnel pour des résultats durables et un bien-être profond.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
