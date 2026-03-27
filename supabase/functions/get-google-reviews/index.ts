// Edge Function : récupère les avis Google (Google Places API) pour les afficher sur le site.
// Variables d'environnement : GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LocalizedText {
  text?: string;
  languageCode?: string;
}

interface AuthorAttribution {
  displayName?: string;
  uri?: string;
  photoUri?: string;
}

interface GoogleReview {
  name?: string;
  text?: LocalizedText;
  originalText?: LocalizedText;
  rating?: number;
  authorAttribution?: AuthorAttribution;
  relativePublishTimeDescription?: string;
}

interface PlaceResponse {
  reviews?: GoogleReview[];
}

export interface ReviewItem {
  name: string;
  text: string;
  rating: number;
}

function normalizeReviews(reviews: GoogleReview[] | undefined): ReviewItem[] {
  if (!Array.isArray(reviews) || reviews.length === 0) return [];
  return reviews
    .filter((r) => r && (r.text?.text || r.originalText?.text) && r.rating != null)
    .map((r) => {
      const textObj = r.text ?? r.originalText;
      const text = typeof textObj?.text === "string" ? textObj.text : "";
      const name =
        r.authorAttribution?.displayName?.trim() || "Client Google";
      const rating = Math.min(5, Math.max(1, Math.round(Number(r.rating))));
      return { name, text, rating };
    });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  const placeId = Deno.env.get("GOOGLE_PLACE_ID");

  if (!apiKey || !placeId) {
    return new Response(
      JSON.stringify({
        error: "Configuration manquante (GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID)",
        reviews: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=reviews`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "reviews",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Places API error:", res.status, errText);
      return new Response(
        JSON.stringify({
          error: "Impossible de récupérer les avis Google",
          reviews: [],
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = (await res.json()) as PlaceResponse;
    const reviews = normalizeReviews(data.reviews);

    return new Response(JSON.stringify({ reviews }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-google-reviews error:", e);
    return new Response(
      JSON.stringify({
        error: String(e instanceof Error ? e.message : e),
        reviews: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
