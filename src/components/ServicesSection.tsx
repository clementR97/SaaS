import { motion } from "framer-motion";
import coachingImg from "@/assets/coaching.jpg";
import maderoImg from "@/assets/maderotherapy.jpg";
import massageImg from "@/assets/massage.jpg";
import naturoImg from "@/assets/naturopathy.jpg";

const services = [
  {
    title: "Coaching sportif personnalisé",
    description: "Des séances sur mesure adaptées à vos objectifs : remise en forme, perte de poids, renforcement musculaire ou préparation physique.",
    image: coachingImg,
    alt: "Coaching sportif en extérieur",
  },
  {
    title: "Madérothérapie",
    description: "Technique naturelle utilisant des instruments en bois pour stimuler le drainage, réduire la cellulite et tonifier la silhouette.",
    image: maderoImg,
    alt: "Outils de madérothérapie en bois",
  },
  {
    title: "Massage bien-être",
    description: "Des massages relaxants et revitalisants pour libérer les tensions, réduire le stress et retrouver une harmonie corps-esprit.",
    image: massageImg,
    alt: "Pierres chaudes et huiles essentielles pour massage",
  },
  {
    title: "Naturopathie",
    description: "Un accompagnement en hygiène de vie, alimentation et remèdes naturels pour renforcer votre vitalité et prévenir les déséquilibres.",
    image: naturoImg,
    alt: "Herbes et remèdes naturels de naturopathie",
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 md:py-32 bg-secondary/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="font-body text-sm tracking-[0.2em] uppercase text-primary mb-4 block">
            Mes prestations
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground">
            Des soins complets pour votre bien-être
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative overflow-hidden rounded-2xl bg-card"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-8">
                <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="font-body text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
