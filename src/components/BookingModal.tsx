import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";

const prestations = [
  {
    name: "Coaching sportif personnalisé",
    sessions: [
      { name: "Séance individuelle 1h", price: "60 €" },
      { name: "Pack 5 séances", price: "270 €" },
      { name: "Pack 10 séances", price: "500 €" },
    ],
  },
  {
    name: "Madérothérapie",
    sessions: [
      { name: "Séance madérothérapie corps", price: "80 €" },
      { name: "Séance madérothérapie ventre", price: "50 €" },
      { name: "Séance madérothérapie cuisses & fessiers", price: "65 €" },
      { name: "Cure 5 séances corps", price: "350 €" },
      { name: "Cure 10 séances corps", price: "650 €" },
    ],
  },
  {
    name: "Massage bien-être",
    sessions: [
      { name: "Massage relaxant corps entier", price: "70 €" },
      { name: "Massage dos & nuque", price: "40 €" },
      { name: "Massage sportif récupération", price: "75 €" },
      { name: "Massage aux pierres chaudes", price: "85 €" },
      { name: "Massage drainant jambes légères", price: "55 €" },
      { name: "Massage visage & crâne", price: "35 €" },
    ],
  },
  {
    name: "Naturopathie",
    sessions: [
      { name: "Consultation initiale 1h30", price: "80 €" },
      { name: "Consultation de suivi 1h", price: "55 €" },
    ],
  },
];

const paymentModes = ["Espèces", "Carte bancaire", "Virement"];

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const phoneRegex = /^\+?[0-9\s]{8,16}$/;

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const BookingModal = ({ open, onOpenChange }: BookingModalProps) => {
  const [step, setStep] = useState(0);
  const [selectedPrestation, setSelectedPrestation] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [form, setForm] = useState({ nom: "", prenom: "", telephone: "", paiement: "" });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setSelectedPrestation(null);
    setSelectedSession(null);
    setForm({ nom: "", prenom: "", telephone: "", paiement: "" });
    setSubmitAttempted(false);
    setSubmitting(false);
    setSubmitError(null);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const currentPrestation = prestations.find((p) => p.name === selectedPrestation);

  const isFormValid =
    form.nom.trim().length >= 2 &&
    form.prenom.trim().length >= 2 &&
    phoneRegex.test(form.telephone.trim()) &&
    !!form.paiement;

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^\d+\s]/g, "");
    setForm((prev) => ({ ...prev, telephone: cleaned }));
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setSubmitError(null);

    if (!isFormValid || !selectedPrestation || !selectedSession || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      // Exemple de payload à envoyer à votre API de réservation :
      // const payload = {
      //   prestation: selectedPrestation,
      //   session: selectedSession,
      //   nom: form.nom.trim(),
      //   prenom: form.prenom.trim(),
      //   telephone: form.telephone.trim(),
      //   paiement: form.paiement,
      //   createdAt: new Date().toISOString(),
      // };
      //
      // await fetch("/api/bookings", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });

      // Simulation d'un aller-retour réseau pour éviter les erreurs côté UI
      await new Promise((resolve) => setTimeout(resolve, 500));

      setStep(3);
    } catch (error) {
      setSubmitError(
        "Une erreur est survenue lors de l'enregistrement de votre demande. Merci de réessayer ou de nous contacter directement.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">
            {step === 3 ? "Confirmation" : "Prendre rendez-vous"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 0: Choose prestation */}
          {step === 0 && (
            <motion.div
              key="step0"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3 mt-4"
            >
              <p className="font-body text-sm text-muted-foreground mb-2">Choisissez une prestation :</p>
              {prestations.map((p) => (
                <button
                  key={p.name}
                  onClick={() => { setSelectedPrestation(p.name); setSelectedSession(null); setStep(1); }}
                  className={`text-left p-4 rounded-xl border transition-all font-body text-sm
                    border-border hover:border-primary hover:bg-primary/5`}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-foreground font-medium">{p.name}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </span>
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 1: Choose session */}
          {step === 1 && currentPrestation && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3 mt-4"
            >
              <p className="font-body text-sm text-muted-foreground mb-2">
                Choisissez une séance pour <span className="text-primary font-medium">{currentPrestation.name}</span> :
              </p>
              {currentPrestation.sessions.map((s) => (
                <button
                  key={s.name}
                  onClick={() => { setSelectedSession(s.name); setStep(2); }}
                  className="text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <span className="flex items-center justify-between font-body text-sm">
                    <span className="text-foreground">{s.name}</span>
                    <span className="text-primary font-semibold ml-4 whitespace-nowrap">{s.price}</span>
                  </span>
                </button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="mt-2 self-start font-body">
                ← Retour
              </Button>
            </motion.div>
          )}

          {/* Step 2: Contact form */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4 mt-4"
            >
              <p className="font-body text-sm text-muted-foreground mb-1">Vos informations :</p>
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="prenom" className="font-body">Prénom</Label>
                  <Input id="prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="Votre prénom" className="mt-1" />
                  {submitAttempted && form.prenom.trim().length < 2 && (
                    <p className="mt-1 text-xs text-destructive">Le prénom doit contenir au moins 2 caractères.</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="nom" className="font-body">Nom</Label>
                  <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Votre nom" className="mt-1" />
                  {submitAttempted && form.nom.trim().length < 2 && (
                    <p className="mt-1 text-xs text-destructive">Le nom doit contenir au moins 2 caractères.</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="telephone" className="font-body">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="mt-1"
                  />
                  {submitAttempted && !phoneRegex.test(form.telephone.trim()) && (
                    <p className="mt-1 text-xs text-destructive">
                      Merci de saisir un numéro de téléphone valide (entre 8 et 16 chiffres).
                    </p>
                  )}
                </div>
                <div>
                  <Label className="font-body">Mode de paiement</Label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {paymentModes.map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setForm({ ...form, paiement: mode })}
                        className={`px-4 py-2 rounded-full border text-sm font-body transition-all ${
                          form.paiement === mode
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-foreground hover:border-primary"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  {submitAttempted && !form.paiement && (
                    <p className="mt-1 text-xs text-destructive">Merci de choisir un mode de paiement.</p>
                  )}
                </div>
              </div>
              {submitError && (
                <p className="text-xs text-destructive mt-2">{submitError}</p>
              )}
              <div className="flex justify-between mt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="font-body">
                  ← Retour
                </Button>
                <Button
                  disabled={!isFormValid || submitting}
                  onClick={handleSubmit}
                  className="rounded-full font-body px-6"
                >
                  {submitting ? "Envoi..." : "Suivant"} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6 mt-6 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <Check className="w-8 h-8 text-primary" />
              </motion.div>
              <div className="text-center">
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  Rendez-vous accepté !
                </h3>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">
                  Merci <span className="font-medium text-foreground">{form.prenom}</span>, votre rendez-vous pour{" "}
                  <span className="font-medium text-primary">{selectedSession}</span> a bien été enregistré.
                  Nous vous contacterons au <span className="font-medium text-foreground">{form.telephone}</span>.
                </p>
              </div>
              <Button onClick={() => handleClose(false)} className="rounded-full font-body px-8 mt-2">
                Fermer
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
