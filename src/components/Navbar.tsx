import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "../assets/logo.png";
import BookingModal from "@/components/BookingModal";

const navLinks = [
  { label: "Accueil", href: "#" },
  { label: "Services", href: "#services" },
  { label: "Méthode", href: "#method" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex shrink-0 items-center">
            <img src={logo} alt="Harmonie & Vitalité" className="size-14 sm:size-16 md:size-20" />
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`font-body text-sm tracking-wide transition-colors hover:text-primary ${
                  scrolled ? "text-muted-foreground" : "text-sand/80"
                }`}
              >
                {link.label}
              </a>
            ))}
            <Button size="sm" className="rounded-full font-body px-6" onClick={() => setIsBookingModalOpen(true)}>
              Rendez-vous
            </Button>
          </div>

          {/* Burger button (mobile only) */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            className={`md:hidden p-2 -mr-2 rounded-lg transition-colors hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              scrolled ? "text-foreground" : "text-warm-white"
            }`}
          >
            <Menu className="w-7 h-7" strokeWidth={1.8} />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay + panel */}
      <div
        className={`md:hidden fixed inset-0 z-[60] transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Fermer le menu"
          className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        />
        {/* Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-sm bg-background shadow-xl flex flex-col transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 sm:px-6 border-b border-border">
            <img src={logo} alt="Harmonie & Vitalité" className="size-12" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer le menu"
              className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex flex-col p-4 sm:p-6 gap-1 overflow-y-auto">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-body text-foreground text-lg py-3 px-4 rounded-xl hover:bg-muted transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                className="w-full rounded-full font-body py-6 text-base"
                onClick={() => {
                  setMenuOpen(false);
                  setIsBookingModalOpen(true);
                }}
              >
                Rendez-vous
              </Button>
            </div>
          </nav>
        </div>
      </div>

      <BookingModal open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen} />
    </>
  );
};

export default Navbar;
