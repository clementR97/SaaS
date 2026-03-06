// @ts-nocheck — Edge Function Deno (Supabase) : l'IDE ne résout pas les types Deno ni les imports HTTP
// Edge Function : synchronise les réservations (bookings) avec Google Calendar.
// Déclenchée par des Database Webhooks Supabase sur INSERT/UPDATE de la table bookings.
// Variables d'environnement requises : GOOGLE_SERVICE_ACCOUNT_JSON, CALENDAR_ID, SUPABASE_SERVICE_ROLE_KEY, (optionnel) WEBHOOK_SECRET

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

function parseHour(heure_rdv: string): { hour: number; minute: number } {
  const match = heure_rdv.match(/^(\d+)h(\d*)$/);
  if (match) {
    return { hour: parseInt(match[1], 10), minute: match[2] ? parseInt(match[2], 10) : 0 };
  }
  return { hour: 9, minute: 0 };
}

/** Décalage Guadeloupe (America/Guadeloupe) : toujours UTC-4, pas d'heure d'été. */
const GUADELOUPE_OFFSET = "-04:00";
const GUADELOUPE_TIMEZONE = "America/Guadeloupe";

function toGoogleDateTime(dateStr: string, heure_rdv: string, durationMinutes: number): { start: string; end: string } {
  const offset = GUADELOUPE_OFFSET;
  const { hour, minute } = parseHour(heure_rdv);
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  const start = `${dateStr}T${h}:${m}:00${offset}`;
  const endHour = hour + Math.floor((minute + durationMinutes) / 60);
  const endMin = (minute + durationMinutes) % 60;
  const eh = String(endHour).padStart(2, "0");
  const em = String(endMin).padStart(2, "0");
  const end = `${dateStr}T${eh}:${em}:00${offset}`;
  return { start, end };
}

interface BookingRecord {
  id: string;
  prenom: string;
  nom: string;
  telephone?: string;
  date_rdv: string;
  heure_rdv: string;
  prestation: string;
  session: string;
  google_event_id?: string | null;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: BookingRecord | null;
  old_record: BookingRecord | null;
}

async function getGoogleAccessToken(saJson: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const { SignJWT, importPKCS8 } = await import("https://deno.land/x/jose@v5.2.0/index.ts");
  const key = await importPKCS8(saJson.private_key.replace(/\\n/g, "\n"), "RS256");
  const jwt = await new SignJWT({ scope: "https://www.googleapis.com/auth/calendar" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(saJson.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google token error: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  record: BookingRecord,
  durationMinutes: number = 60,
): Promise<string> {
  const { start, end } = toGoogleDateTime(record.date_rdv, record.heure_rdv, durationMinutes);
  const body = {
    summary: `${record.prestation} – ${record.session}`,
    description: `Client: ${record.prenom} ${record.nom}\nTél: ${record.telephone ?? ""}\nRéservation site`,
    start: { dateTime: start, timeZone: GUADELOUPE_TIMEZONE },
    end: { dateTime: end, timeZone: GUADELOUPE_TIMEZONE },
  };
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google Calendar create error: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.id;
}

async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  record: BookingRecord,
  durationMinutes: number = 60,
): Promise<void> {
  const { start, end } = toGoogleDateTime(record.date_rdv, record.heure_rdv, durationMinutes);
  const body = {
    summary: `${record.prestation} – ${record.session}`,
    description: `Client: ${record.prenom} ${record.nom}\nTél: ${record.telephone ?? ""}\nRéservation site`,
    start: { dateTime: start, timeZone: GUADELOUPE_TIMEZONE },
    end: { dateTime: end, timeZone: GUADELOUPE_TIMEZONE },
  };
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google Calendar update error: ${res.status} ${t}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  if (webhookSecret) {
    const provided = req.headers.get("x-webhook-secret");
    if (provided !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const saJsonRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  const calendarId = Deno.env.get("CALENDAR_ID");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!saJsonRaw || !calendarId || !serviceRoleKey || !supabaseUrl) {
    return new Response(
      JSON.stringify({
        error: "Missing GOOGLE_SERVICE_ACCOUNT_JSON, CALENDAR_ID, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (payload.table !== "bookings" || (payload.schema && payload.schema !== "public")) {
    return new Response(JSON.stringify({ ok: true, skipped: "not bookings table" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const record = payload.record as BookingRecord | null;
  const oldRecord = payload.old_record as BookingRecord | null;

  if (payload.type === "DELETE" || !record) {
    return new Response(JSON.stringify({ ok: true, skipped: "no record" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const isInsert = payload.type === "INSERT";
  const isUpdate = payload.type === "UPDATE";
  const dateOrTimeChanged =
    isUpdate &&
    oldRecord &&
    (oldRecord.date_rdv !== record.date_rdv || oldRecord.heure_rdv !== record.heure_rdv);
  const onlyGoogleEventIdUpdate =
    isUpdate &&
    oldRecord &&
    record.google_event_id &&
    !oldRecord.google_event_id &&
    oldRecord.date_rdv === record.date_rdv &&
    oldRecord.heure_rdv === record.heure_rdv;

  if (onlyGoogleEventIdUpdate) {
    return new Response(JSON.stringify({ ok: true, skipped: "our own google_event_id update" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isInsert && !dateOrTimeChanged) {
    return new Response(JSON.stringify({ ok: true, skipped: "no date/time change" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let saJson: { client_email: string; private_key: string };
  try {
    saJson = typeof saJsonRaw === "string" ? JSON.parse(saJsonRaw) : saJsonRaw;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid GOOGLE_SERVICE_ACCOUNT_JSON" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const durationMinutes = 60;

  try {
    const accessToken = await getGoogleAccessToken(saJson);
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (isInsert || !record.google_event_id) {
      const eventId = await createCalendarEvent(accessToken, calendarId, record, durationMinutes);
      await supabase.from("bookings").update({ google_event_id: eventId }).eq("id", record.id);
      return new Response(JSON.stringify({ ok: true, created: eventId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await updateCalendarEvent(accessToken, calendarId, record.google_event_id, record, durationMinutes);
    return new Response(JSON.stringify({ ok: true, updated: record.google_event_id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Sync failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
