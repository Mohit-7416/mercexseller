// Mints a scoped LiveKit access token. Sellers get publish rights for rooms
// matching their listing id; viewers get subscribe-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AccessToken } from "https://esm.sh/livekit-server-sdk@2.9.7?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const wsUrl = Deno.env.get("LIVEKIT_URL");
    if (!apiKey || !apiSecret || !wsUrl) {
      return new Response(JSON.stringify({ error: "LiveKit not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const listingId: string = body.listingId;
    const role: "seller" | "viewer" = body.role === "seller" ? "seller" : "viewer";
    const displayName: string = body.name || user.email || "Guest";
    if (!listingId) {
      return new Response(JSON.stringify({ error: "listingId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If seller, verify ownership of the listing
    if (role === "seller") {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: listing } = await admin
        .from("listings")
        .select("id, shop_id, shops(owner_id)")
        .eq("id", listingId)
        .maybeSingle();
      // @ts-ignore nested shape
      const ownerId = listing?.shops?.owner_id;
      if (!listing || ownerId !== user.id) {
        return new Response(JSON.stringify({ error: "Not listing owner" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const room = `listing_${listingId}`;
    const at = new AccessToken(apiKey, apiSecret, {
      identity: `${role}_${user.id}`,
      name: displayName,
      ttl: 60 * 60 * 2, // 2h
    });
    at.addGrant({
      room,
      roomJoin: true,
      canPublish: role === "seller",
      canSubscribe: true,
      canPublishData: true,
    });
    const token = await at.toJwt();

    return new Response(JSON.stringify({ token, url: wsUrl, room }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
