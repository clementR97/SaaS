import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useServicesCards, SERVICES_CARDS_QUERY_KEY } from "@/hooks/useServicesCards";
import { BOOKING_CONFIG_QUERY_KEY } from "@/hooks/useBookingConfig";
import type { BookingConfig } from "@/types/booking";
import { cardsToPrestations } from "@/utils/syncServicesToPrestations";
import {
  DEFAULT_SERVICES_CARDS,
  newServiceCard,
  type ServiceCardConfig,
  type ServiceImageKey,
  type ServiceSessions,
} from "@/types/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const IMAGE_OPTIONS: { value: ServiceImageKey; label: string }[] = [
  { value: "coaching", label: "Coaching" },
  { value: "madero", label: "Madérothérapie" },
  { value: "massage", label: "Massage" },
  { value: "naturo", label: "Naturopathie" },
  { value: "zen", label: "Zen (visuel massage)" },
];

function cloneCards(c: ServiceCardConfig[]): ServiceCardConfig[] {
  return JSON.parse(JSON.stringify(c)) as ServiceCardConfig[];
}

function sessionsForKind(kind: ServiceSessions["kind"]): ServiceSessions {
  switch (kind) {
    case "empty":
      return { kind: "empty" };
    case "simple":
      return { kind: "simple", items: [{ name: "Séance", price: "—" }] };
    case "madero":
      return {
        kind: "madero",
        items: [{ name: "1 séance", zone1: "—", zone2: "—" }],
      };
    case "zen":
      return {
        kind: "zen",
        packs: [
          {
            name: "Pack Standard",
            price: "—",
            descriptionItems: ["Ligne 1", "Ligne 2"],
          },
        ],
      };
    default:
      return { kind: "simple", items: [{ name: "Séance", price: "—" }] };
  }
}

export default function ServicesConfigForm() {
  const queryClient = useQueryClient();
  const { cards, loading } = useServicesCards();
  const [draft, setDraft] = useState<ServiceCardConfig[]>(() => cloneCards(DEFAULT_SERVICES_CARDS));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!loading) setDraft(cloneCards(cards));
  }, [cards, loading]);

  const updateCard = (index: number, patch: Partial<ServiceCardConfig>) => {
    setDraft((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const setCardSessionsKind = (index: number, kind: ServiceSessions["kind"]) => {
    setDraft((prev) =>
      prev.map((c, i) => (i === index ? { ...c, sessions: sessionsForKind(kind) } : c)),
    );
  };

  const save = async () => {
    if (!supabase) return;
    setSaving(true);
    setMessage(null);
    try {
      const booking = queryClient.getQueryData<BookingConfig>(BOOKING_CONFIG_QUERY_KEY);
      const prestations = cardsToPrestations(draft);

      const { error } = await supabase.from("site_config").upsert(
        [
          { key: "services_cards", value: draft },
          { key: "prestations", value: prestations },
        ],
        { onConflict: "key" },
      );
      if (error) throw error;
      queryClient.setQueryData(SERVICES_CARDS_QUERY_KEY, draft);
      queryClient.setQueryData(BOOKING_CONFIG_QUERY_KEY, (prev: BookingConfig | undefined) => {
        const base = prev ?? booking;
        if (!base) return prev;
        return { ...base, prestations };
      });
      void queryClient.invalidateQueries({ queryKey: SERVICES_CARDS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BOOKING_CONFIG_QUERY_KEY });
      setMessage({
        type: "ok",
        text: "Cartes enregistrées. Les prestations du formulaire de réservation sont alignées (noms, séances, tarifs affichés).",
      });
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message ?? "Erreur d’enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  const removeCard = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const addCard = () => {
    setDraft((prev) => [...prev, newServiceCard()]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Cartes « Services » (page d’accueil)</CardTitle>
          <CardDescription>
            Ces cartes alimentent aussi la liste des prestations et des séances dans le formulaire « Prendre rendez-vous ».
            Les noms de prestation (titres) sont utilisés dans l’onglet « Résas & horaires » pour les quotas et l’emploi du temps.
          </CardDescription>
        </CardHeader>
      </Card>

      {draft.map((card, ci) => (
        <Card key={card.id}>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
            <CardTitle className="font-display text-lg">Carte {ci + 1}</CardTitle>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="font-body"
              onClick={() => removeCard(ci)}
            >
              Supprimer la carte
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-body">Titre (face avant)</Label>
                <Input
                  className="font-body"
                  value={card.title}
                  onChange={(e) => updateCard(ci, { title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Titre (face arrière)</Label>
                <Input
                  className="font-body"
                  value={card.backTitle}
                  onChange={(e) => updateCard(ci, { backTitle: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-body">Description courte (face avant)</Label>
              <Textarea
                className="font-body min-h-[80px]"
                value={card.description}
                onChange={(e) => updateCard(ci, { description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Texte alternatif image (accessibilité)</Label>
              <Input
                className="font-body"
                value={card.alt}
                onChange={(e) => updateCard(ci, { alt: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label className="font-body">Photo</Label>
                <Select
                  value={card.imageKey}
                  onValueChange={(v) => updateCard(ci, { imageKey: v as ServiceImageKey })}
                >
                  <SelectTrigger className="w-[220px] font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="font-body">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  id={`flip-${card.id}`}
                  checked={card.flippable}
                  onChange={(e) => updateCard(ci, { flippable: e.target.checked })}
                  className="rounded border-input"
                />
                <Label htmlFor={`flip-${card.id}`} className="font-body cursor-pointer">
                  Carte retournable (tarifs au verso)
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-body">Type de contenu au verso</Label>
              <Select
                value={card.sessions.kind}
                onValueChange={(v) => setCardSessionsKind(ci, v as ServiceSessions["kind"])}
              >
                <SelectTrigger className="max-w-md font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple" className="font-body">
                    Liste nom + prix (une colonne)
                  </SelectItem>
                  <SelectItem value="madero" className="font-body">
                    Madéro : Zone 1 / Zone 2
                  </SelectItem>
                  <SelectItem value="zen" className="font-body">
                    Packs Zen (prix + liste au clic)
                  </SelectItem>
                  <SelectItem value="empty" className="font-body">
                    Vide (message court)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {card.sessions.kind === "simple" && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm font-medium">Lignes tarifaires</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-body"
                    onClick={() =>
                      setDraft((prev) =>
                        prev.map((c, i) =>
                          i === ci && c.sessions.kind === "simple"
                            ? {
                                ...c,
                                sessions: {
                                  kind: "simple",
                                  items: [...c.sessions.items, { name: "", price: "" }],
                                },
                              }
                            : c,
                        ),
                      )
                    }
                  >
                    Ajouter une ligne
                  </Button>
                </div>
                {card.sessions.items.map((row, ri) => (
                  <div key={ri} className="flex flex-wrap gap-2 items-end">
                    <Input
                      className="font-body flex-1 min-w-[140px]"
                      placeholder="Nom"
                      value={row.name}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev.map((c, i) => {
                            if (i !== ci || c.sessions.kind !== "simple") return c;
                            const items = c.sessions.items.map((x, j) =>
                              j === ri ? { ...x, name: e.target.value } : x,
                            );
                            return { ...c, sessions: { kind: "simple", items } };
                          }),
                        )
                      }
                    />
                    <Input
                      className="font-body w-28"
                      placeholder="Prix"
                      value={row.price}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev.map((c, i) => {
                            if (i !== ci || c.sessions.kind !== "simple") return c;
                            const items = c.sessions.items.map((x, j) =>
                              j === ri ? { ...x, price: e.target.value } : x,
                            );
                            return { ...c, sessions: { kind: "simple", items } };
                          }),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="font-body text-destructive"
                      onClick={() =>
                        setDraft((prev) =>
                          prev.map((c, i) => {
                            if (i !== ci || c.sessions.kind !== "simple") return c;
                            const items = c.sessions.items.filter((_, j) => j !== ri);
                            return {
                              ...c,
                              sessions: {
                                kind: "simple",
                                items: items.length ? items : [{ name: "", price: "" }],
                              },
                            };
                          }),
                        )
                      }
                    >
                      Retirer
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {card.sessions.kind === "madero" && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm font-medium">Forfaits (zones)</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-body"
                    onClick={() =>
                      setDraft((prev) =>
                        prev.map((c, i) =>
                          i === ci && c.sessions.kind === "madero"
                            ? {
                                ...c,
                                sessions: {
                                  kind: "madero",
                                  items: [
                                    ...c.sessions.items,
                                    { name: "", zone1: "", zone2: "" },
                                  ],
                                },
                              }
                            : c,
                        ),
                      )
                    }
                  >
                    Ajouter une ligne
                  </Button>
                </div>
                {card.sessions.items.map((row, ri) => (
                  <div key={ri} className="flex flex-wrap gap-2 items-end">
                    <Input
                      className="font-body flex-1 min-w-[120px]"
                      placeholder="Nom"
                      value={row.name}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev.map((c, i) => {
                            if (i !== ci || c.sessions.kind !== "madero") return c;
                            const items = c.sessions.items.map((x, j) =>
                              j === ri ? { ...x, name: e.target.value } : x,
                            );
                            return { ...c, sessions: { kind: "madero", items } };
                          }),
                        )
                      }
                    />
                    <Input
                      className="font-body w-24"
                      placeholder="Zone 1"
                      value={row.zone1}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev.map((c, i) => {
                            if (i !== ci || c.sessions.kind !== "madero") return c;
                            const items = c.sessions.items.map((x, j) =>
                              j === ri ? { ...x, zone1: e.target.value } : x,
                            );
                            return { ...c, sessions: { kind: "madero", items } };
                          }),
                        )
                      }
                    />
                    <Input
                      className="font-body w-24"
                      placeholder="Zone 2"
                      value={row.zone2}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev.map((c, i) => {
                            if (i !== ci || c.sessions.kind !== "madero") return c;
                            const items = c.sessions.items.map((x, j) =>
                              j === ri ? { ...x, zone2: e.target.value } : x,
                            );
                            return { ...c, sessions: { kind: "madero", items } };
                          }),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="font-body text-destructive"
                      onClick={() =>
                        setDraft((prev) =>
                          prev.map((c, i) => {
                            if (i !== ci || c.sessions.kind !== "madero") return c;
                            const items = c.sessions.items.filter((_, j) => j !== ri);
                            return {
                              ...c,
                              sessions: {
                                kind: "madero",
                                items: items.length ? items : [{ name: "", zone1: "", zone2: "" }],
                              },
                            };
                          }),
                        )
                      }
                    >
                      Retirer
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {card.sessions.kind === "zen" && (
              <div className="space-y-4 rounded-lg border p-3">
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm font-medium">Packs Zen</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-body"
                    onClick={() =>
                      setDraft((prev) =>
                        prev.map((c, i) =>
                          i === ci && c.sessions.kind === "zen"
                            ? {
                                ...c,
                                sessions: {
                                  kind: "zen",
                                  packs: [
                                    ...c.sessions.packs,
                                    { name: "Nouveau pack", price: "", descriptionItems: [""] },
                                  ],
                                },
                              }
                            : c,
                        ),
                      )
                    }
                  >
                    Ajouter un pack
                  </Button>
                </div>
                {card.sessions.packs.map((pack, pi) => (
                  <div key={pi} className="rounded-md bg-muted/40 p-3 space-y-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-body text-sm font-medium">Pack {pi + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="font-body text-destructive h-8"
                        onClick={() =>
                          setDraft((prev) =>
                            prev.map((c, i) => {
                              if (i !== ci || c.sessions.kind !== "zen") return c;
                              const packs = c.sessions.packs.filter((_, j) => j !== pi);
                              return {
                                ...c,
                                sessions: {
                                  kind: "zen",
                                  packs: packs.length
                                    ? packs
                                    : [{ name: "", price: "", descriptionItems: [""] }],
                                },
                              };
                            }),
                          )
                        }
                      >
                        Supprimer ce pack
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="font-body text-xs">Nom du pack</Label>
                        <Input
                          className="font-body"
                          value={pack.name}
                          onChange={(e) =>
                            setDraft((prev) =>
                              prev.map((c, i) => {
                                if (i !== ci || c.sessions.kind !== "zen") return c;
                                const packs = c.sessions.packs.map((p, j) =>
                                  j === pi ? { ...p, name: e.target.value } : p,
                                );
                                return { ...c, sessions: { kind: "zen", packs } };
                              }),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-body text-xs">Prix</Label>
                        <Input
                          className="font-body"
                          value={pack.price}
                          onChange={(e) =>
                            setDraft((prev) =>
                              prev.map((c, i) => {
                                if (i !== ci || c.sessions.kind !== "zen") return c;
                                const packs = c.sessions.packs.map((p, j) =>
                                  j === pi ? { ...p, price: e.target.value } : p,
                                );
                                return { ...c, sessions: { kind: "zen", packs } };
                              }),
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="font-body text-xs">Lignes de la liste (au clic sur le pack)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="font-body h-7 text-xs"
                          onClick={() =>
                            setDraft((prev) =>
                              prev.map((c, i) => {
                                if (i !== ci || c.sessions.kind !== "zen") return c;
                                const packs = c.sessions.packs.map((p, j) =>
                                  j === pi
                                    ? { ...p, descriptionItems: [...p.descriptionItems, ""] }
                                    : p,
                                );
                                return { ...c, sessions: { kind: "zen", packs } };
                              }),
                            )
                          }
                        >
                          + ligne
                        </Button>
                      </div>
                      {pack.descriptionItems.map((line, li) => (
                        <div key={li} className="flex gap-2">
                          <Input
                            className="font-body flex-1"
                            placeholder={`Ligne ${li + 1}`}
                            value={line}
                            onChange={(e) =>
                              setDraft((prev) =>
                                prev.map((c, i) => {
                                  if (i !== ci || c.sessions.kind !== "zen") return c;
                                  const packs = c.sessions.packs.map((p, j) => {
                                    if (j !== pi) return p;
                                    const descriptionItems = p.descriptionItems.map((t, k) =>
                                      k === li ? e.target.value : t,
                                    );
                                    return { ...p, descriptionItems };
                                  });
                                  return { ...c, sessions: { kind: "zen", packs } };
                                }),
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="font-body text-destructive shrink-0"
                            onClick={() =>
                              setDraft((prev) =>
                                prev.map((c, i) => {
                                  if (i !== ci || c.sessions.kind !== "zen") return c;
                                  const packs = c.sessions.packs.map((p, j) => {
                                    if (j !== pi) return p;
                                    const descriptionItems = p.descriptionItems.filter((_, k) => k !== li);
                                    return {
                                      ...p,
                                      descriptionItems: descriptionItems.length
                                        ? descriptionItems
                                        : [""],
                                    };
                                  });
                                  return { ...c, sessions: { kind: "zen", packs } };
                                }),
                              )
                            }
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addCard} className="font-body">
        Ajouter une carte service
      </Button>

      {message && (
        <p className={`text-sm font-body ${message.type === "ok" ? "text-green-600" : "text-destructive"}`}>
          {message.text}
        </p>
      )}
      <Button type="button" onClick={save} disabled={saving} className="font-body">
        {saving ? "Enregistrement…" : "Enregistrer les cartes services"}
      </Button>
    </div>
  );
}
