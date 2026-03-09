import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sophie L.",
    text: "Après 3 mois de coaching et de madérothérapie, j'ai retrouvé une silhouette qui me plaît et surtout une énergie incroyable. L'approche globale fait toute la différence !",
    rating: 5,
  },
  {
    name: "Marc D.",
    text: "Je cherchais plus qu'un simple coach sportif. L'accompagnement en naturopathie m'a permis de revoir mon alimentation et les massages m'aident à gérer mon stress professionnel.",
    rating: 5,
  },
  {
    name: "Camille R.",
    text: "Une approche vraiment humaine et personnalisée. Chaque séance est adaptée à mon état du moment. J'ai perdu 8 kg en 4 mois de manière naturelle et durable.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 sm:py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="font-body text-xs sm:text-sm tracking-[0.2em] uppercase text-primary mb-3 sm:mb-4 block">
            Témoignages
          </span>
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-semibold text-foreground">
            Ils ont transformé leur quotidien
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-card relative"
            >
              <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-primary/15 absolute top-4 right-4 sm:top-6 sm:right-6" />
              <div className="flex gap-1 mb-3 sm:mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-6 italic">
                "{testimonial.text}"
              </p>
              <p className="font-body font-medium text-foreground">
                {testimonial.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
