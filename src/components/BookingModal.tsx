import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useBookingConfig } from "@/hooks/useBookingConfig";
import type { ActivityType } from "@/types/booking";
import {
  getTimeSlotsForDate,
  isDateDisabledForActivity,
} from "@/utils/bookingSlots";

const paymentModes = ["Espèces", "Carte bancaire"];

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
  const { config, loading: configLoading } = useBookingConfig();
  const [step, setStep] = useState(0);
  const [selectedPrestation, setSelectedPrestation] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ nom: "", prenom: "", telephone: "", paiement: "" });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slotCounts, setSlotCounts] = useState<Map<string, number>>(new Map());

  const reset = () => {
    setStep(0);
    setSelectedPrestation(null);
    setSelectedSession(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setForm({ nom: "", prenom: "", telephone: "", paiement: "" });
    setSubmitAttempted(false);
    setSubmitting(false);
    setSubmitError(null);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const prestations = config.prestations;
  const currentPrestation = prestations.find((p) => p.name === selectedPrestation);
  const activityType: ActivityType | null =
    selectedPrestation && config.prestationActivity[selectedPrestation] ? config.prestationActivity[selectedPrestation] : null;

  const slotKey = (date: Date, timeValue: string) => `${date.toISOString().slice(0, 10)}|${timeValue}`;
  const quota = activityType ? (config.activityQuota[activityType] ?? 1) : 1;
  const getSlotCount = (date: Date, timeValue: string) => slotCounts.get(slotKey(date, timeValue)) ?? 0;
  const isSlotBooked = (date: Date, timeValue: string) => getSlotCount(date, timeValue) >= quota;

  useEffect(() => {
    if (step !== 2 || !open || !supabase || !activityType) return;
    let cancelled = false;
    void supabase.rpc("get_slot_counts", { p_activity_type: activityType }).then(({ data, error }) => {
      if (cancelled || error) return;
      const map = new Map<string, number>();
      (data ?? []).forEach((row: { date_rdv: string; heure_rdv: string; count: number }) => {
        map.set(`${row.date_rdv}|${row.heure_rdv}`, Number(row.count));
      });
      setSlotCounts(map);
    });
    return () => {
      cancelled = true;
    };
  }, [step, open, activityType]);

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

    if (!isFormValid || !selectedPrestation || !selectedSession || !selectedDate || !selectedTime || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      if (supabase) {
        const { error } = await supabase.from("bookings").insert({
          prenom: form.prenom.trim(),
          nom: form.nom.trim(),
          telephone: form.telephone.trim(),
          date_rdv: selectedDate.toISOString().slice(0, 10),
          heure_rdv: selectedTime,
          mode_paiement: form.paiement,
          prestation: selectedPrestation,
          session: selectedSession,
          activity_type: activityType ?? undefined,
        });
        if (error) throw error;
        setSlotCounts((prev) => new Map(prev).set(slotKey(selectedDate, selectedTime), getSlotCount(selectedDate, selectedTime) + 1));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      setStep(4);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "23505"
          ? "Ce créneau vient d'être réservé par quelqu'un d'autre. Revenez au calendrier et choisissez un autre créneau."
          : "Une erreur est survenue lors de l'enregistrement de votre demande. Merci de réessayer ou de nous contacter directement.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl sm:text-2xl text-foreground">
            {step === 4 ? "Confirmation" : "Prendre rendez-vous"}
          </DialogTitle>
        </DialogHeader>

        {configLoading ? (
          <p className="font-body text-muted-foreground py-6">Chargement de la configuration…</p>
        ) : (
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
                  onClick={() => { setSelectedSession(s.name); setSelectedDate(undefined); setSelectedTime(null); setStep(2); }}
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

          {/* Step 2: Date et heure (créneaux 1h) */}
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
              <p className="font-body text-sm text-muted-foreground mb-3">
                Choisissez une date et un créneau pour <span className="text-primary font-medium">{selectedSession}</span> :
              </p>

              {/* Version mobile : même calendrier que desktop (dates indisponibles grisées) + créneaux */}
              <div className="flex flex-col gap-4 md:hidden">
                <div className="space-y-2">
                  <Label className="font-body text-sm font-medium">Date</Label>
                  <div className="flex justify-center w-full">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => { setSelectedDate(date); setSelectedTime(null); }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) return true;
                        if (activityType == null) return false;
                        return isDateDisabledForActivity(date, activityType, config.adminSchedule, config.slotDurationMinutes);
                      }}
                      className="rounded-xl border border-border bg-card shrink-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-time-mobile" className="font-body text-sm font-medium">
                    Heure
                  </Label>
                  {selectedDate && activityType ? (
                    (() => {
                      const slots = getTimeSlotsForDate(selectedDate, activityType, config.adminSchedule, config.slotDurationMinutes);
                      const today = new Date();
                      const isToday = selectedDate.toDateString() === today.toDateString();
                      const nowMin = today.getHours() * 60 + today.getMinutes();
                      return slots.length === 0 ? (
                        <p className="font-body text-sm text-muted-foreground py-4 text-center">Aucun créneau ce jour pour cette prestation.</p>
                      ) : (
                        <select
                          id="booking-time-mobile"
                          value={selectedTime ?? ""}
                          onChange={(e) => setSelectedTime(e.target.value || null)}
                          className="flex h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-body ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <option value="">Choisir un créneau</option>
                          {slots.map((slot) => {
                            const isPast = isToday && slot.minutesFromMidnight < nowMin;
                            const reserved = isSlotBooked(selectedDate, slot.value);
                            const n = getSlotCount(selectedDate, slot.value);
                            return (
                              <option key={slot.value} value={slot.value} disabled={isPast || reserved}>
                                {slot.label} — {n}/{quota}{reserved ? " (complet)" : ""}
                              </option>
                            );
                          })}
                        </select>
                      );
                    })()
                  ) : (
                    <select
                      id="booking-time-mobile"
                      value=""
                      disabled
                      className="flex h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-body opacity-50"
                    >
                      <option value="">Sélectionnez une date ci-dessus</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Version desktop : calendrier + grille de créneaux (filtrés selon l'emploi du temps) */}
              <div className="hidden md:grid grid-cols-[1fr_minmax(240px,280px)] gap-4 sm:gap-6 items-start">
                <div className="flex justify-start w-full min-w-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => { setSelectedDate(date); setSelectedTime(null); }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      if (activityType == null) return false;
                      return isDateDisabledForActivity(date, activityType, config.adminSchedule, config.slotDurationMinutes);
                    }}
                    className="rounded-xl border border-border bg-card shrink-0"
                  />
                </div>
                <div className="min-w-0 w-full rounded-xl border border-border bg-muted/30 p-4">
                  <Label className="font-body text-sm font-medium text-foreground mb-3 block">
                    Heure
                  </Label>
                  {selectedDate ? (
                    (() => {
                      const slots = activityType
                        ? getTimeSlotsForDate(selectedDate, activityType, config.adminSchedule, config.slotDurationMinutes)
                        : [];
                      const today = new Date();
                      const isToday = selectedDate.toDateString() === today.toDateString();
                      const nowMin = today.getHours() * 60 + today.getMinutes();
                      return slots.length === 0 ? (
                        <p className="font-body text-sm text-muted-foreground py-6 text-center">Aucun créneau ce jour pour cette prestation.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 max-h-[240px] sm:max-h-[280px] overflow-y-auto pr-1">
                          {slots.map((slot) => {
                            const isPast = isToday && slot.minutesFromMidnight < nowMin;
                            const reserved = isSlotBooked(selectedDate, slot.value);
                            const disabled = isPast || reserved;
                            const n = getSlotCount(selectedDate, slot.value);
                            return (
                              <button
                                key={slot.value}
                                type="button"
                                disabled={disabled}
                                onClick={() => !disabled && setSelectedTime(slot.value)}
                                className={`rounded-lg border px-3 py-2.5 text-sm font-body transition-all text-left ${
                                  selectedTime === slot.value
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : disabled
                                      ? "border-border text-muted-foreground opacity-50 cursor-not-allowed"
                                      : "border-border hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                {slot.label} — {n}/{quota}{reserved ? " (complet)" : ""}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    <p className="font-body text-sm text-muted-foreground py-8 text-center">Sélectionnez d&apos;abord une date.</p>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="font-body">
                  ← Retour
                </Button>
                <Button
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                  className="rounded-full font-body px-6"
                >
                  Suivant <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Contact form */}
          {step === 3 && (
            <motion.div
              key="step3"
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
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="font-body">
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

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <motion.div
              key="step4"
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
                  <span className="font-medium text-primary">{selectedSession}</span>
                  {selectedDate && selectedTime && (
                    <> le <span className="font-medium text-foreground">{selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span> à <span className="font-medium text-foreground">{selectedTime}</span></>
                  )}{" "}
                  a bien été enregistré.
                  Nous vous contacterons au <span className="font-medium text-foreground">{form.telephone}</span>.
                </p>
              </div>
              <Button onClick={() => handleClose(false)} className="rounded-full font-body px-8 mt-2">
                Fermer
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
