import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, BOOKINGS_LIST_COLUMNS, type BookingRow } from "@/lib/supabase";
import { useBookingConfig, BOOKING_CONFIG_QUERY_KEY } from "@/hooks/useBookingConfig";
import { mergeBookingModalFlags, type BookingConfig } from "@/types/booking";
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
import ServicesConfigForm from "@/components/ServicesConfigForm";
import { LogOut, Calendar, Settings, LayoutGrid, KeyRound } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Checkbox } from "@/components/ui/checkbox";

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
      .select(BOOKINGS_LIST_COLUMNS)
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

  const prestationKey = editBooking?.prestation ?? "";
  const prestationKnown =
    Boolean(prestationKey) && config.prestations.some((p) => p.name === prestationKey);
  const editDateObj = editDate ? new Date(editDate + "T12:00:00") : null;
  const allowedTimeSlots =
    editBooking && editDateObj && prestationKey
      ? getTimeSlotsForDate(editDateObj, prestationKey, config.adminSchedule, config.slotDurationMinutes)
      : [];
  const quotaForEdit = prestationKey ? (config.activityQuota[prestationKey] ?? 1) : 1;
  const countBySlot = (() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      if (b.id === editBooking?.id) continue;
      const slotId = b.activity_type ?? b.prestation;
      if (slotId !== prestationKey) continue;
      const key = `${b.date_rdv}|${b.heure_rdv}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  })();
  const isSlotBooked = (d: string, h: string) => (countBySlot.get(`${d}|${h}`) ?? 0) >= quotaForEdit;
  const isEditDateDisabled = (dateStr: string) => {
    if (!prestationKey) return true;
    const d = new Date(dateStr + "T12:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return true;
    return isDateDisabledForActivity(d, prestationKey, config.adminSchedule, config.slotDurationMinutes);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Seo title="Tableau de bord" path="/admin/dashboard" noindex />
        <p className="font-body text-muted-foreground">Vérification de la session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Seo title="Tableau de bord" path="/admin/dashboard" noindex />
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
          <TabsList className="grid w-full max-w-3xl grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
            <TabsTrigger value="reservations" className="gap-1.5 font-body text-xs sm:text-sm px-2 py-2">
              <Calendar className="h-4 w-4 shrink-0" /> <span className="truncate">Réservations</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-1.5 font-body text-xs sm:text-sm px-2 py-2">
              <Settings className="h-4 w-4 shrink-0" /> <span className="truncate">Résas & horaires</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1.5 font-body text-xs sm:text-sm px-2 py-2">
              <LayoutGrid className="h-4 w-4 shrink-0" /> <span className="truncate">Cartes services</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-1.5 font-body text-xs sm:text-sm px-2 py-2">
              <KeyRound className="h-4 w-4 shrink-0" /> <span className="truncate">Compte</span>
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
            <ConfigForm config={config} loading={configLoading} />
          </TabsContent>

          <TabsContent value="services">
            <ServicesConfigForm />
          </TabsContent>

          <TabsContent value="account">
            <AdminPasswordCard />
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
              {!prestationKnown && (
                <p className="text-sm text-amber-600 font-body">
                  Prestation « {editBooking.prestation} » absente des cartes services. Ajoutez-la dans l&apos;onglet Cartes services pour la gérer dans les quotas et l&apos;emploi du temps.
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
                {editDate && prestationKnown && isEditDateDisabled(editDate) && (
                  <p className="text-sm text-destructive font-body">Aucun créneau ce jour pour cette prestation (emploi du temps).</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="font-body">Heure</Label>
                {editDate && prestationKnown && !isEditDateDisabled(editDate) ? (
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
                  disabled={saving || !prestationKey || isEditDateDisabled(editDate) || !allowedTimeSlots.some((s) => s.value === editHeure) || isSlotBooked(editDate, editHeure)}
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

const MIN_ADMIN_PASSWORD_LEN = 6;

function AdminPasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!supabase) {
      setMessage({ type: "error", text: "Supabase n'est pas configuré." });
      return;
    }
    if (newPassword.length < MIN_ADMIN_PASSWORD_LEN) {
      setMessage({
        type: "error",
        text: `Le nouveau mot de passe doit contenir au moins ${MIN_ADMIN_PASSWORD_LEN} caractères.`,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "La confirmation ne correspond pas au nouveau mot de passe." });
      return;
    }
    setSaving(true);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user?.email) {
      setSaving(false);
      setMessage({ type: "error", text: "Impossible de lire le compte connecté." });
      return;
    }
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signErr) {
      setSaving(false);
      setMessage({ type: "error", text: "Mot de passe actuel incorrect." });
      return;
    }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (updateErr) {
      setMessage({ type: "error", text: updateErr.message ?? "Mise à jour impossible." });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage({ type: "ok", text: "Mot de passe mis à jour." });
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="font-display">Mot de passe</CardTitle>
        <CardDescription>
          Modifiez votre mot de passe de connexion à l&apos;administration. Vous devez saisir l&apos;ancien mot de passe pour confirmer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-current-pw" className="font-body">
              Mot de passe actuel
            </Label>
            <Input
              id="admin-current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="font-body"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-new-pw" className="font-body">
              Nouveau mot de passe
            </Label>
            <Input
              id="admin-new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={MIN_ADMIN_PASSWORD_LEN}
              className="font-body"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-confirm-pw" className="font-body">
              Confirmer le nouveau mot de passe
            </Label>
            <Input
              id="admin-confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={MIN_ADMIN_PASSWORD_LEN}
              className="font-body"
              required
            />
          </div>
          {message && (
            <p
              className={`text-sm font-body ${message.type === "ok" ? "text-green-600" : "text-destructive"}`}
            >
              {message.text}
            </p>
          )}
          <Button type="submit" className="font-body" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ConfigForm({ config, loading }: { config: BookingConfig; loading: boolean }) {
  const queryClient = useQueryClient();
  const [adminSchedule, setAdminSchedule] = useState(config.adminSchedule);
  const [activityQuota, setActivityQuota] = useState(config.activityQuota);
  const [modalFlags, setModalFlags] = useState(() =>
    mergeBookingModalFlags(config.prestations, config.bookingModalFlags),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const firstPrestationName = config.prestations[0]?.name ?? "";

  useEffect(() => {
    setAdminSchedule(config.adminSchedule);
    setActivityQuota(config.activityQuota);
    setModalFlags(mergeBookingModalFlags(config.prestations, config.bookingModalFlags));
  }, [config]);

  useEffect(() => {
    setActivityQuota((prev) => {
      const next: Record<string, number> = {};
      for (const p of config.prestations) {
        next[p.name] = prev[p.name] ?? 1;
      }
      return next;
    });
  }, [config.prestations]);

  const save = async () => {
    if (!supabase) return;
    setSaving(true);
    setMessage(null);
    try {
      await supabase.from("site_config").upsert(
        [
          { key: "admin_schedule", value: adminSchedule },
          { key: "slot_duration_minutes", value: 60 },
          { key: "activity_quota", value: activityQuota },
          { key: "booking_modal_flags", value: modalFlags },
        ],
        { onConflict: "key" },
      );
      setMessage({ type: "ok", text: "Configuration enregistrée." });
      void queryClient.invalidateQueries({ queryKey: BOOKING_CONFIG_QUERY_KEY });
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message ?? "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  const addScheduleSlot = () => {
    const t = firstPrestationName || "Prestation";
    setAdminSchedule((s) => [...s, { day: 1, type: t, startHour: 9, endHour: 18, slotDurationMinutes: 60 }]);
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
          <CardTitle className="font-display">Prestations (réservation)</CardTitle>
          <CardDescription>
            Les noms et les séances proposées au client sont synchronisés depuis l’onglet « Cartes services ». Modifiez-les
            uniquement là-bas pour éviter les doublons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm font-body text-muted-foreground border rounded-lg p-4 bg-muted/30">
            {config.prestations.map((p) => (
              <li key={p.name}>
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="text-muted-foreground"> — {p.sessions.length} séance(s)</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Emploi du temps (créneaux disponibles)</CardTitle>
          <CardDescription>
            Jour (0=dim, 1=lun… 6=sam). <strong>Prestation</strong> : même libellé que dans « Cartes services » (ex. Coaching sportif personnalisé). Heures en 24h. Durée = durée d&apos;une séance pour ce créneau (ex: 35 min). Ajoutez une ligne par prestation et plage horaire.
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
              <span className="font-body text-sm">Prestation</span>
              <Select
                value={slot.type}
                onValueChange={(v) => updateScheduleSlot(i, { ...slot, type: v })}
              >
                <SelectTrigger className="min-w-[200px] max-w-[280px] h-8 font-body text-sm">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {config.prestations.map((p) => (
                    <SelectItem key={p.name} value={p.name} className="font-body">
                      {p.name}
                    </SelectItem>
                  ))}
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
          <CardTitle className="font-display">Quota par prestation</CardTitle>
          <CardDescription>
            Nombre max de clients qui peuvent réserver le même créneau (même date, même heure) pour cette prestation. Ex. : 2 = deux RDV à 9h pour le coaching. Une nouvelle prestation ajoutée dans « Cartes services » apparaît ici après enregistrement des cartes (quota par défaut 1).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {config.prestations.map((p) => (
            <div key={p.name} className="flex flex-wrap gap-2 items-center">
              <span className="font-body text-sm flex-1 min-w-[12rem] truncate" title={p.name}>
                {p.name}
              </span>
              <Input
                type="number"
                min={1}
                max={20}
                value={activityQuota[p.name] ?? 1}
                onChange={(e) =>
                  setActivityQuota((q) => ({ ...q, [p.name]: Math.max(1, parseInt(e.target.value, 10) || 1) }))
                }
                className="font-body w-20 h-8"
              />
              <span className="font-body text-muted-foreground text-sm">client(s) max / créneau</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Présentation du formulaire (côté client)</CardTitle>
          <CardDescription>
            Contrôle de l’affichage dans la fenêtre « Prendre rendez-vous » sur le site public.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="show-contact-modal"
              checked={modalFlags.showContactBlock}
              onCheckedChange={(v) => setModalFlags((m) => ({ ...m, showContactBlock: v === true }))}
            />
            <div className="grid gap-1">
              <Label htmlFor="show-contact-modal" className="font-body text-sm font-medium cursor-pointer">
                Afficher « Me contacter ou plus d&apos;informations » (téléphone)
              </Label>
              <p className="font-body text-xs text-muted-foreground">
                Si décoché, ce bloc n’apparaît pas sur la première étape du formulaire.
              </p>
            </div>
          </div>
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="font-body text-sm font-medium text-foreground">Prestations affichées dans le modal</p>
            <p className="font-body text-xs text-muted-foreground">
              Une case par prestation (noms des cartes services). Décochez pour masquer une prestation dans « Prendre rendez-vous » sans la retirer du site. Les nouvelles cartes sont visibles par défaut.
            </p>
            <div className="space-y-3">
              {config.prestations.map((p, i) => (
                <div key={p.name} className="flex items-start gap-3">
                  <Checkbox
                    id={`modal-prestation-${i}`}
                    checked={modalFlags.prestationModalVisibility?.[p.name] !== false}
                    onCheckedChange={(v) =>
                      setModalFlags((m) => ({
                        ...m,
                        prestationModalVisibility: {
                          ...m.prestationModalVisibility,
                          [p.name]: v === true,
                        },
                      }))
                    }
                  />
                  <div className="grid gap-0.5 min-w-0">
                    <Label htmlFor={`modal-prestation-${i}`} className="font-body text-sm font-medium cursor-pointer leading-snug">
                      {p.name}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
