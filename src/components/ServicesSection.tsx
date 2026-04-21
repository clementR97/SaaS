import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useServicesCards } from "@/hooks/useServicesCards";
import { SERVICE_IMAGE_BY_KEY } from "@/lib/serviceSectionAssets";
import type { ServiceCardConfig } from "@/types/services";

const ServicesSection = () => {
  const { cards } = useServicesCards();
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [expandedZenKey, setExpandedZenKey] = useState<string | null>(null);

  useEffect(() => {
    const flipped = cards.find((c) => c.id === flippedId);
    if (!flipped || flipped.sessions.kind !== "zen") setExpandedZenKey(null);
  }, [flippedId, cards]);

  const handleCardClick = (id: string, flippable: boolean) => {
    if (!flippable) return;
    setFlippedId((prev) => (prev === id ? null : id));
  };

  const resolveImage = (c: ServiceCardConfig) => SERVICE_IMAGE_BY_KEY[c.imageKey] ?? SERVICE_IMAGE_BY_KEY.coaching;

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
            {cards.map((service, index) => {
              const isFlipped = flippedId === service.id;
              const sessions = service.sessions;
              const isZen = sessions.kind === "zen";

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className={`relative rounded-xl sm:rounded-2xl overflow-hidden min-h-[min(480px,85vh)] sm:min-h-[min(500px,80vh)] md:min-h-[min(680px,85vh)] ${service.flippable ? "cursor-pointer" : ""}`}
                  style={{ perspective: "1280px" }}
                  onClick={() => handleCardClick(service.id, service.flippable)}
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                    style={{ transformStyle: "preserve-3d", position: "relative", width: "100%", height: "100%" }}
                  >
                    <div
                      className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl bg-card"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={resolveImage(service)}
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

                    {service.flippable && (
                      <div
                        className="absolute inset-0 rounded-xl sm:rounded-2xl bg-card overflow-hidden flex flex-col"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        <div className="p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col h-full min-h-0">
                          <h3 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-foreground mb-3 sm:mb-4 md:mb-6 text-center shrink-0">
                            {service.backTitle}
                          </h3>

                          {isZen ? (
                            <div
                              className="flex-1 flex flex-col gap-3 sm:gap-4 min-h-0 overflow-y-auto"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              role="presentation"
                            >
                              {sessions.packs.map((pack, i) => {
                                const zKey = `${service.id}::${i}`;
                                return (
                                  <motion.div
                                    key={zKey}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isFlipped ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                                    className="rounded-lg border border-border bg-background/50 p-3 sm:p-4 text-left"
                                  >
                                    <button
                                      type="button"
                                      className="w-full flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 text-left rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                      onClick={() =>
                                        setExpandedZenKey((prev) => (prev === zKey ? null : zKey))
                                      }
                                    >
                                      <span className="font-body font-semibold text-foreground text-sm sm:text-base pr-2">
                                        {pack.name}
                                      </span>
                                      <span className="font-display text-lg sm:text-xl font-semibold text-primary shrink-0">
                                        {pack.price}
                                      </span>
                                    </button>
                                    {expandedZenKey === zKey && (
                                      <ul className="mt-3 sm:mt-4 space-y-2 border-t border-border pt-3 list-disc list-inside text-sm text-muted-foreground marker:text-primary">
                                        {pack.descriptionItems.map((item, li) => (
                                          <li key={`${zKey}-${li}`} className="font-body leading-relaxed">
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>
                          ) : sessions.kind === "empty" ? (
                            <div className="flex-1 flex items-center justify-center min-h-0">
                              <p className="font-body text-sm text-muted-foreground text-center px-4">
                                Tarifs sur demande ou consultation.
                              </p>
                            </div>
                          ) : sessions.kind === "simple" ? (
                            <div className="flex-1 flex flex-col justify-center gap-2 sm:gap-3 min-h-0 overflow-y-auto">
                              {sessions.items.map((session, i) => (
                                <motion.div
                                  key={`${service.id}-${session.name}-${i}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={isFlipped ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 sm:py-3 border-b border-border last:border-0 min-w-0"
                                >
                                  <span className="font-body text-foreground text-xs sm:text-sm md:text-base truncate min-w-0">
                                    {session.name}
                                  </span>
                                  <span className="font-display text-base sm:text-lg md:text-xl font-semibold text-primary shrink-0">
                                    {session.price}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                          ) : sessions.kind === "madero" ? (
                            <div className="flex-1 flex flex-col justify-center gap-2 sm:gap-3 min-h-0 overflow-y-auto">
                              {sessions.items.map((session, i) => (
                                <motion.div
                                  key={`${service.id}-${session.name}-${i}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={isFlipped ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 sm:py-3 border-b border-border last:border-0 min-w-0"
                                >
                                  <span className="font-body text-foreground text-xs sm:text-sm md:text-base truncate min-w-0">
                                    {session.name}
                                  </span>
                                  <div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
                                    <span className="font-display text-base sm:text-lg md:text-xl font-semibold text-primary">
                                      1 Zone : {session.zone1}
                                    </span>
                                    <span className="font-display text-sm sm:text-base md:text-lg font-semibold text-primary/80">
                                      2 Zones : {session.zone2}
                                    </span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : null}

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
