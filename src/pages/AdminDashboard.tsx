import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { BookingRow } from "@/lib/supabase";
import { useBookingConfig } from "@/hooks/useBookingConfig";
import type { ActivityType, BookingConfig } from "@/types/booking";
import { getTimeSlotsForDate, isDateDisabledForActivity } from "@/utils/bookingSlots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Calendar, Settings } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { config, loading: configLoading } = useBookingConfig();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [editBooking, setEditBooking] = useState<BookingRow | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editHeure, setEditHeure] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthChecked(true);
      if (!session) {
        navigate("/admin", { replace: true });
        return;
      }
      loadBookings();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/admin", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadBookings = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .gte("date_rdv", today())
      .order("date_rdv", { ascending: true })
      .order("heure_rdv", { ascending: true });
    setLoading(false);
    if (error) return;
    setBookings((data ?? []) as BookingRow[]);
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    navigate("/admin", { replace: true });
  };

  const updateStatutPaiement = async (id: string, statut_paiement: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("bookings").update({ statut_paiement }).eq("id", id);
    if (!error) setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, statut_paiement } : b)));
  };

  const openEditModal = (b: BookingRow) => {
    setEditBooking(b);
    setEditDate(b.date_rdv);
    setEditHeure(b.heure_rdv);
    setEditError(null);
  };

  const saveEditDateHeure = async () => {
    if (!supabase || !editBooking?.id) return;
    setEditError(null);
    setSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({ date_rdv: editDate, heure_rdv: editHeure })
      .eq("id", editBooking.id);
    setSaving(false);
    if (error) {
      setEditError(error.message ?? "Créneau peut-être déjà pris.");
      return;
    }
    setBookings((prev) =>
      prev.map((b) => (b.id === editBooking.id ? { ...b, date_rdv: editDate, heure_rdv: editHeure } : b)),
    );
    setEditBooking(null);
  };

  const activityType = editBooking ? config.prestationActivity[editBooking.prestation] ?? null : null;
  const editDateObj = editDate ? new Date(editDate + "T12:00:00") : null;
  const allowedTimeSlots =
    editBooking && editDateObj && activityType
      ? getTimeSlotsForDate(editDateObj, activityType, config.adminSchedule, config.slotDurationMinutes)
      : [];
  const bookedSlotKeys = new Set(
    bookings
      .filter((b) => b.id !== editBooking?.id)
      .map((b) => `${b.date_rdv}|${b.heure_rdv}`),
  );
  const isSlotBooked = (d: string, h: string) => bookedSlotKeys.has(`${d}|${h}`);
  const isEditDateDisabled = (dateStr: string) => {
    if (!activityType) return true;
    const d = new Date(dateStr + "T12:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return true;
    return isDateDisabledForActivity(d, activityType, config.adminSchedule, config.slotDurationMinutes);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="font-body text-muted-foreground">Vérification de la session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold">Tableau de bord admin</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="font-body gap-2">
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="reservations" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="reservations" className="gap-2 font-body">
              <Calendar className="h-4 w-4" /> Réservations
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2 font-body">
              <Settings className="h-4 w-4" /> Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reservations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Réservations à venir</CardTitle>
                <CardDescription>Modifiez le statut de paiement ou la date/heure.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="font-body text-muted-foreground py-8 text-center">Chargement…</p>
                ) : bookings.length === 0 ? (
                  <p className="font-body text-muted-foreground py-8 text-center">Aucune réservation à venir.</p>
                ) : (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-body">Prénom</TableHead>
                          <TableHead className="font-body">Nom</TableHead>
                          <TableHead className="font-body">Tél.</TableHead>
                          <TableHead className="font-body">Email</TableHead>
                          <TableHead className="font-body">Date</TableHead>
                          <TableHead className="font-body">Heure</TableHead>
                          <TableHead className="font-body">Prestation</TableHead>
                          <TableHead className="font-body">Séance</TableHead>
                          <TableHead className="font-body">Paiement</TableHead>
                          <TableHead className="font-body text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-body">{b.prenom}</TableCell>
                            <TableCell className="font-body">{b.nom}</TableCell>
                            <TableCell className="font-body">{b.telephone}</TableCell>
                            <TableCell className="font-body text-muted-foreground">{b.email ?? "—"}</TableCell>
                            <TableCell className="font-body">{b.date_rdv}</TableCell>
                            <TableCell className="font-body">{b.heure_rdv}</TableCell>
                            <TableCell className="font-body">{b.prestation}</TableCell>
                            <TableCell className="font-body">{b.session}</TableCell>
                            <TableCell>
                              <Select
                                value={b.statut_paiement ?? "non payé"}
                                onValueChange={(v) => b.id && updateStatutPaiement(b.id, v)}
                              >
                                <SelectTrigger className="w-[120px] font-body h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="payé" className="font-body">Payé</SelectItem>
                                  <SelectItem value="non payé" className="font-body">Non payé</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" className="font-body" onClick={() => openEditModal(b)}>
                                Modifier date/heure
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <ConfigForm
              config={config}
              loading={configLoading}
              onSaved={() => {}}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!editBooking} onOpenChange={(open) => !open && setEditBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Modifier date et heure</DialogTitle>
          </DialogHeader>
          {editBooking && (
            <div className="space-y-4 pt-2">
              {!activityType && (
                <p className="text-sm text-amber-600 font-body">
                  Prestation « {editBooking.prestation} » non associée à un type dans la configuration. Associez-la dans l&apos;onglet Configuration.
                </p>
              )}
              <div className="space-y-2">
                <Label className="font-body">Date</Label>
                <Input
                  type="date"
                  min={today()}
                  value={editDate}
                  onChange={(e) => { setEditDate(e.target.value); setEditHeure(""); }}
                  className="font-body"
                />
                {editDate && activityType && isEditDateDisabled(editDate) && (
                  <p className="text-sm text-destructive font-body">Aucun créneau ce jour pour cette prestation (emploi du temps).</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="font-body">Heure</Label>
                {editDate && activityType && !isEditDateDisabled(editDate) ? (
                  <Select
                    value={allowedTimeSlots.some((s) => s.value === editHeure) ? editHeure : ""}
                    onValueChange={setEditHeure}
                  >
                    <SelectTrigger className="font-body">
                      <SelectValue placeholder="Choisir un créneau" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedTimeSlots.map((slot) => {
                        const reserved = isSlotBooked(editDate, slot.value);
                        return (
                          <SelectItem
                            key={slot.value}
                            value={slot.value}
                            className="font-body"
                            disabled={reserved}
                          >
                            {slot.label}{reserved ? " (réservé)" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value="" disabled>
                    <SelectTrigger className="font-body">
                      <SelectValue placeholder="Choisir d'abord une date valide" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                )}
              </div>
              {editError && <p className="text-sm text-destructive font-body">{editError}</p>}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditBooking(null)} className="font-body">Annuler</Button>
                <Button
                  onClick={saveEditDateHeure}
                  disabled={saving || !activityType || isEditDateDisabled(editDate) || !allowedTimeSlots.some((s) => s.value === editHeure) || isSlotBooked(editDate, editHeure)}
                  className="font-body"
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfigForm({
  config,
  loading,
  onSaved,
}: {
  config: BookingConfig;
  loading: boolean;
  onSaved: () => void;
}) {
  const [prestations, setPrestations] = useState(config.prestations);
  const [adminSchedule, setAdminSchedule] = useState(config.adminSchedule);
  const [prestationActivity, setPrestationActivity] = useState(config.prestationActivity);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    setPrestations(config.prestations);
    setAdminSchedule(config.adminSchedule);
    setPrestationActivity(config.prestationActivity);
  }, [config]);

  const save = async () => {
    if (!supabase) return;
    setSaving(true);
    setMessage(null);
    try {
      await supabase.from("site_config").upsert(
        [
          { key: "prestations", value: prestations },
          { key: "admin_schedule", value: adminSchedule },
          { key: "slot_duration_minutes", value: 60 },
          { key: "prestation_activity", value: prestationActivity },
        ],
        { onConflict: "key" },
      );
      setMessage({ type: "ok", text: "Configuration enregistrée." });
      onSaved();
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message ?? "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  const addPrestation = () => {
    setPrestations((p) => [...p, { name: "Nouvelle prestation", sessions: [{ name: "Séance", price: "0 €" }] }]);
    setPrestationActivity((prev) => ({ ...prev, "Nouvelle prestation": "sport" }));
  };
  const updatePrestation = (index: number, name: string, sessions: { name: string; price: string }[]) => {
    setPrestations((p) => p.map((x, i) => (i === index ? { name, sessions } : x)));
  };
  const removePrestation = (index: number) => {
    const name = prestations[index]?.name;
    setPrestations((p) => p.filter((_, i) => i !== index));
    if (name) setPrestationActivity((prev) => { const next = { ...prev }; delete next[name]; return next; });
  };

  const addScheduleSlot = () => {
    setAdminSchedule((s) => [...s, { day: 1, type: "sport", startHour: 9, endHour: 18, slotDurationMinutes: 60 }]);
  };
  const updateScheduleSlot = (index: number, slot: (typeof adminSchedule)[0]) => {
    setAdminSchedule((s) => s.map((x, i) => (i === index ? slot : x)));
  };
  const removeScheduleSlot = (index: number) => {
    setAdminSchedule((s) => s.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="font-body text-muted-foreground text-center">Chargement de la configuration…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Prestations</CardTitle>
          <CardDescription>Liste des prestations et séances affichées dans le formulaire de réservation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {prestations.map((p, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  value={p.name}
                  onChange={(e) => updatePrestation(i, e.target.value, p.sessions)}
                  placeholder="Nom prestation"
                  className="font-body flex-1"
                />
                <Button variant="outline" size="sm" onClick={() => removePrestation(i)} className="font-body">
                  Supprimer
                </Button>
              </div>
              <div className="pl-2 space-y-1">
                {p.sessions.map((s, j) => (
                  <div key={j} className="flex gap-2 items-center text-sm">
                    <Input
                      value={s.name}
                      onChange={(e) =>
                        updatePrestation(
                          i,
                          p.name,
                          p.sessions.map((x, k) => (k === j ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      placeholder="Séance"
                      className="font-body h-8 flex-1"
                    />
                    <Input
                      value={s.price}
                      onChange={(e) =>
                        updatePrestation(
                          i,
                          p.name,
                          p.sessions.map((x, k) => (k === j ? { ...x, price: e.target.value } : x)),
                        )
                      }
                      placeholder="Prix"
                      className="font-body h-8 w-24"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addPrestation} className="font-body">
            Ajouter une prestation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Emploi du temps (créneaux disponibles)</CardTitle>
          <CardDescription>
            Jour (0=dim, 1=lun… 6=sam). Type: sport, naturopathie, massage, madero. Heures en 24h. Durée = durée d&apos;une séance pour ce créneau (ex: 35 min).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {adminSchedule.map((slot, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-center rounded border p-2">
              <span className="font-body text-sm">Jour</span>
              <Input
                type="number"
                min={0}
                max={6}
                value={slot.day}
                onChange={(e) => updateScheduleSlot(i, { ...slot, day: Number(e.target.value) })}
                className="font-body w-14 h-8"
              />
              <span className="font-body text-sm">Type</span>
              <Select
                value={slot.type}
                onValueChange={(v) => updateScheduleSlot(i, { ...slot, type: v as "sport" | "naturopathie" | "massage" | "madero" })}
              >
                <SelectTrigger className="w-[140px] h-8 font-body text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sport" className="font-body">sport</SelectItem>
                  <SelectItem value="naturopathie" className="font-body">naturopathie</SelectItem>
                  <SelectItem value="massage" className="font-body">massage</SelectItem>
                  <SelectItem value="madero" className="font-body">madero</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={0}
                max={23}
                value={slot.startHour}
                onChange={(e) => updateScheduleSlot(i, { ...slot, startHour: Number(e.target.value) })}
                className="font-body w-14 h-8"
                placeholder="Début"
              />
              <span className="font-body text-sm">–</span>
              <Input
                type="number"
                min={0}
                max={24}
                value={slot.endHour}
                onChange={(e) => updateScheduleSlot(i, { ...slot, endHour: Number(e.target.value) })}
                className="font-body w-14 h-8"
                placeholder="Fin"
              />
              <span className="font-body text-sm">Durée (min)</span>
              <Input
                type="number"
                min={15}
                max={120}
                value={slot.slotDurationMinutes ?? 60}
                onChange={(e) => updateScheduleSlot(i, { ...slot, slotDurationMinutes: Number(e.target.value) || 60 })}
                className="font-body w-16 h-8"
              />
              <Button variant="ghost" size="sm" onClick={() => removeScheduleSlot(i)} className="font-body text-destructive">
                Retirer
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addScheduleSlot} className="font-body">
            Ajouter un créneau
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Lien prestation → type d'activité</CardTitle>
          <CardDescription>
            Chaque prestation doit être associée à un type (sport, naturopathie, massage, madero) pour l'emploi du temps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.keys(prestationActivity).length === 0 && prestations.length > 0 && (
            <p className="text-sm text-muted-foreground font-body">
              Ajoutez des correspondances. Les noms doivent correspondre exactement aux noms des prestations ci-dessus.
            </p>
          )}
          {prestations.map((p) => (
            <div key={p.name} className="flex gap-2 items-center">
              <span className="font-body text-sm w-48 truncate">{p.name}</span>
              <Select
                value={prestationActivity[p.name] ?? "sport"}
                onValueChange={(v) => setPrestationActivity((prev) => ({ ...prev, [p.name]: v as ActivityType }))}
              >
                <SelectTrigger className="w-[140px] h-8 font-body text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sport" className="font-body">sport</SelectItem>
                  <SelectItem value="naturopathie" className="font-body">naturopathie</SelectItem>
                  <SelectItem value="massage" className="font-body">massage</SelectItem>
                  <SelectItem value="madero" className="font-body">madero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      {message && (
        <p className={`text-sm font-body ${message.type === "ok" ? "text-green-600" : "text-destructive"}`}>
          {message.text}
        </p>
      )}
      <Button onClick={save} disabled={saving} className="font-body">
        {saving ? "Enregistrement…" : "Enregistrer la configuration"}
      </Button>
    </div>
  );
}
