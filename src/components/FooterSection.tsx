import { MapPin, Phone, Mail, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PUBLIC_CONTACT_PHONE, PUBLIC_WHATSAPP_URL, PUBLIC_INSTAGRAM_URL } from "@/lib/publicContact";
import byCRImg from "../assets/guadeloupe.png";
const FooterSection = () => {
  return (
    <footer id="contact" className="py-12 sm:py-16 bg-foreground text-primary-foreground/80">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
          {/* Brand */}
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary-foreground mb-3 sm:mb-4">
              Harmonie & Vitalité
            </h3>
            <p className="font-body text-sm leading-relaxed text-primary-foreground/60">
              Coach sportif, madérothérapie, massages bien-être et naturopathie. Une approche holistique pour votre transformation.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold text-primary-foreground mb-4">
              Contact
            </h4>
            <div className="space-y-3 font-body text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary-foreground/50" />
                <span>Choisy, Sainte-Claude 97120 Guadeloupe</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-foreground/50" />
                <span>{PUBLIC_CONTACT_PHONE}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-foreground/50" />
                <span>quentin.roland97@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Social & WhatsApp */}
          <div>
            <h4 className="font-display text-lg font-semibold text-primary-foreground mb-4">
              Suivez-moi
            </h4>
            <div className="flex gap-4 mb-6">
              <a href={PUBLIC_INSTAGRAM_URL} className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>

             <a href={PUBLIC_WHATSAPP_URL}><Button
              size="sm"
              className="rounded-full font-body px-6 bg-sage hover:bg-sage/90 text-primary-foreground"
            >
               
              💬 WhatsApp
            </Button></a>
            </div>
            
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 text-center flex flex-col gap-2">
          <p className="font-body text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} KaruZen Guadeloupe. Tous droits réservés.
          </p>
          <div className="w-full flex justify-center overflow-x-auto [scrollbar-width:thin]">
            <p className="font-body text-xs text-primary-foreground/35 inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap px-1">
              Site propulsé par
              <img src={byCRImg} alt="" className="w-4 h-4 shrink-0" aria-hidden />
              <span className="text-primary-foreground/50">CR Développement</span>.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
