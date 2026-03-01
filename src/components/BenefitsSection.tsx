import { motion } from "framer-motion";
import { Heart, Sparkles, Brain, Zap } from "lucide-react";

const benefits = [
  { icon: Heart, title: "Bien-être global", description: "Un équilibre retrouvé entre corps et esprit pour une vie plus harmonieuse." },
  { icon: Sparkles, title: "Silhouette affinée", description: "Des résultats visibles grâce à une approche combinée sport et soins naturels." },
  { icon: Brain, title: "Réduction du stress", description: "Libérez vos tensions et retrouvez calme intérieur et sérénité au quotidien." },
  { icon: Zap, title: "Énergie & confiance", description: "Réveillez votre vitalité et gagnez en confiance grâce à une hygiène de vie optimisée." },
];

const BenefitsSection = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="font-body text-sm tracking-[0.2em] uppercase text-primary mb-4 block">
            Les bénéfices
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground">
            Ce que vous allez gagner
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center p-8 rounded-2xl bg-sage-light/50 hover:bg-sage-light transition-colors duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
