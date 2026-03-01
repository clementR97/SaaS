import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Accueil", href: "#" },
  { label: "Services", href: "#services" },
  { label: "Méthode", href: "#method" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <a href="#" className={`font-display text-2xl font-semibold transition-colors ${scrolled ? "text-foreground" : "text-warm-white"}`}>
          Harmonie & Vitalité
        </a>

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
          <Button size="sm" className="rounded-full font-body px-6">
            Rendez-vous
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden ${scrolled ? "text-foreground" : "text-warm-white"}`}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-lg border-t border-border">
          <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-body text-foreground py-2"
              >
                {link.label}
              </a>
            ))}
            <Button className="rounded-full font-body mt-2">
              Rendez-vous
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
