import { motion } from "framer-motion";
import { ClipboardCheck, UserCheck, Leaf } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    step: "01",
    title: "Diagnostic personnalisé",
    description: "Un bilan complet pour comprendre vos besoins, vos objectifs et votre mode de vie actuel.",
  },
  {
    icon: UserCheck,
    step: "02",
    title: "Suivi sur mesure",
    description: "Un programme adapté qui évolue avec vous, combinant sport, soins et conseils nutritionnels.",
  },
  {
    icon: Leaf,
    step: "03",
    title: "Approche naturelle & durable",
    description: "Des méthodes respectueuses de votre corps pour des résultats qui durent dans le temps.",
  },
];

const MethodSection = () => {
  return (
    <section id="method" className="py-24 md:py-32 bg-secondary/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="font-body text-sm tracking-[0.2em] uppercase text-primary mb-4 block">
            Ma méthode
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground">
            Un accompagnement en 3 étapes
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative p-8 rounded-2xl bg-card"
            >
              <span className="font-display text-6xl font-bold text-primary/10 absolute top-4 right-6">
                {step.step}
              </span>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="font-body text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MethodSection;
