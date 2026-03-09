import { motion } from "framer-motion";
import coachingImg from "@/assets/coaching.jpg";
import maderoImg from "@/assets/maderotherapy.jpg";
import massageImg from "@/assets/massage.jpg";
import naturoImg from "@/assets/naturopathy.jpg";
import { useState } from "react";

const massages = [
  {name:"Fwotman 35min (sportif)", price:"45€"},
  {name:"Karu'zen 1h (relaxant)", price:"65€"},
  {name:"Californien 1h (relaxant)", price:"65€"},
  {name:"Reflexologie plantaire 30min", price:"30€"},
  {name:"Amma assis (relaxant)", price:"25€"},
];
const maderotherapie = [
  { name: "séance découverte", price: { zone1: "50€", zone2: "—" } },
  {name:"1 séance", price:{zone1:"60€",zone2:"100€"}},
  {name:"4 séances", price:{zone1:"220€",zone2:"380€"}},
  {name:"8 séances", price:{zone1:"450€",zone2:"780€"}},
  {name:"14 séances", price:{zone1:"800€",zone2:"1350€"}},
];
const coach = [
  {name:"Coaching", price:"30€/h"},
  {name:"Cure minceur", price:"sur devis"},
  {name:"Intervention en entreprise", price:"sur devis"}
];
const naturo = [null];


const services = [
  {
    title: "Coaching sportif personnalisé",
    description: "Des séances sur mesure adaptées à vos objectifs : remise en forme, perte de poids, renforcement musculaire ou préparation physique.",
    image: coachingImg,
    alt: "Coaching sportif en extérieur",
    flippable: true,
    backTitle: "La séance de coaching",
    sessions:coach,
  },
  {
    title: "Madérothérapie",
    description: "Technique naturelle utilisant des instruments en bois pour stimuler le drainage, réduire la cellulite et tonifier la silhouette.",
    image: maderoImg,
    alt: "Outils de madérothérapie en bois",
    flippable: true,
    backTitle: "Nos séances madérothérapie",
    sessions:maderotherapie,
  },
  {
    title: "Massage bien-être",
    description: "Des massages relaxants et revitalisants pour libérer les tensions, réduire le stress et retrouver une harmonie corps-esprit.",
    image: massageImg,
    alt: "Pierres chaudes et huiles essentielles pour massage",
    flippable: true,
    backTitle: "Nos séances massage",
    sessions:massages,
  },
  {
    title: "Naturopathie",
    description: "Un accompagnement en hygiène de vie, alimentation et remèdes naturels pour renforcer votre vitalité et prévenir les déséquilibres.",
    image: naturoImg,
    alt: "Herbes et remèdes naturels de naturopathie",
    flippable: true,
    backTitle: "Nos séances Naturopathie",
    sessions: naturo,
  },
];

const ServicesSection = () => {
  
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  
  const handleCardClick = (title: string, flippable: boolean) =>{
    if(!flippable) return;
    setFlippedCard(prev => prev === title ? null : title)

  }
  return (
    <section id="services" className="py-16 sm:py-24 md:py-24 lg:py-32 bg-secondary/50">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <span className="font-body text-xs sm:text-sm tracking-[0.2em] uppercase text-primary mb-3 sm:mb-4 block">
            Mes prestations
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground">
            Des soins complets pour votre bien-être
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8">

          {services.map((service, index) => {
            const isFlipped = flippedCard === service.title;

            return(
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`relative rounded-xl sm:rounded-2xl overflow-hidden min-h-[min(480px,85vh)] sm:min-h-[min(500px,80vh)] md:min-h-[min(680px,85vh)] ${service.flippable ? "cursor-pointer" : ""}`}
              style={{ perspective: "1280px" }}
              onClick={()=>{handleCardClick(service.title, service.flippable)}}
            >
              <motion.div
              animate={{rotateY: isFlipped ? 180 : 0}}
              transition={{duration:0.7, ease:[0.23, 1, 0.32, 1]}}
              style={{transformStyle: "preserve-3d", position:"relative", width:"100%",height:"100%"}}
              >
                {/* front */}
                
                <div
                className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl bg-card"
                style={{ backfaceVisibility: "hidden" }}
                >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4 sm:p-5 md:p-6 lg:p-8">
                <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-foreground mb-2 sm:mb-3">
                  {service.title}
                </h3>
                <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {service.description}
                </p>
                {service.flippable && (
                  <p className="font-body text-xs text-primary mt-3 sm:mt-4 tracking-wide uppercase">
                    cliquez pour voir les séances
                  </p>
                )}
                </div>
              </div>
              {/* Back */}
              {service.flippable && (
                <div
                className="absolute inset-0 rounded-xl sm:rounded-2xl bg-card overflow-hidden flex flex-col"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col h-full min-h-0">
                    <h3 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-foreground mb-3 sm:mb-4 md:mb-6 text-center shrink-0">
                      {service.backTitle}
                    </h3>
                    <div className="flex-1 flex flex-col justify-center gap-2 sm:gap-3 min-h-0 overflow-y-auto">
                    {(service.sessions || []).filter((s): s is NonNullable<typeof s> => s != null).map((session, i) => {
                      const isMaderotherapie = service.title === "Madérothérapie";
                      const priceObj = typeof session.price === "object" && session.price !== null && "zone1" in session.price
                        ? (session.price as { zone1: string; zone2: string })
                        : null;
                      const showZonePrices = isMaderotherapie && priceObj !== null;

                      return (
                        <motion.div
                          key={session.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={isFlipped ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 sm:py-3 border-b border-border last:border-0 min-w-0"
                        >
                          <span className="font-body text-foreground text-xs sm:text-sm md:text-base truncate min-w-0">
                            {session.name}
                          </span>
                          {showZonePrices && priceObj ? (
                            <div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
                              <span className="font-display text-base sm:text-lg md:text-xl font-semibold text-primary">
                                Zone 1 : {priceObj.zone1}
                              </span>
                              <span className="font-display text-sm sm:text-base md:text-lg font-semibold text-primary/80">
                                Zone 2 : {priceObj.zone2}
                              </span>
                            </div>
                          ) : (
                            <span className="font-display text-base sm:text-lg md:text-xl font-semibold text-primary shrink-0">
                              {typeof session.price === "string" ? session.price : "—"}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-4 sm:mt-6 text-center tracking-wide uppercase shrink-0">
                      Cliquez pour revenir
                    </p>
                  </div>
                </div>
              )}
              </motion.div>
            </motion.div>
            );
           })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
