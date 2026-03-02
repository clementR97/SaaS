import {useState} from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CalendarCheck } from "lucide-react";
import BookingModal from "@/components/BookingModal";

const CtaSection = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  return (
    <>
    <section className="py-24 md:py-32 bg-primary relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-foreground/5 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary-foreground/5 translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto text-center"
        >
          <CalendarCheck className="w-10 h-10 text-primary-foreground/80 mx-auto mb-6" />
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-primary-foreground mb-6">
            Prêt(e) à commencer votre transformation ?
          </h2>
          <p className="font-body text-lg text-primary-foreground/80 leading-relaxed mb-10">
            Réservez votre première séance découverte et commençons ensemble votre parcours vers un bien-être durable.
          </p>
          <Button
            size="lg"
            className="text-base px-10 py-6 rounded-full font-body font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            onClick={() =>setIsBookingModalOpen(true)}
          >
            Réserver ma séance découverte
          </Button>
        </motion.div>
      </div>
    </section>
    <BookingModal open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen} />
    </>
  );
};

export default CtaSection;
