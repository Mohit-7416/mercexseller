import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useListings } from "@/hooks/useListings";
import { useProfile } from "@/hooks/useProfile";
import { useOrders } from "@/hooks/useOrders";
import { useShop } from "@/contexts/ShopContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Mic, MicOff, Video as VideoIcon, VideoOff,
  Send, Heart, ThumbsDown, FileText, Package, Trophy, MessageCircle, Volume2, VolumeX, Loader2, User, Mail, Phone, MapPin,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ChatMsg {
  id: string;
  user: string;
  text: string;
  kind?: "msg" | "join" | "bid";
  ts: number;
}

const LiveBroadcast = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings, updateListing } = useListings();
  const { profile } = useProfile();
  const { currentShop } = useShop();
  const { orders } = useOrders();
  const listing = listings.find(l => l.id === id);
  const isAuction = listing?.type === "auction";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [starting, setStarting] = useState(true);
  const [viewers, setViewers] = useState(1);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [topBid, setTopBid] = useState<number>(0);

  // Dialogs
  const [showInfo, setShowInfo] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [showWinners, setShowWinners] = useState(false);

  // Linked items for this listing
  const [linkedItems, setLinkedItems] = useState<any[]>([]);
  const purchasers = orders.filter(o => o.listing_id === id);

  const roomRef = useRef<import("livekit-client").Room | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("listing_items")
        .select("*, items(*)")
        .eq("listing_id", id);
      setLinkedItems(data || []);
    })();
  }, [id]);

  // Connect to LiveKit, publish camera + mic
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const { Room, RoomEvent, Track } = await import("livekit-client");
        const { data, error } = await supabase.functions.invoke("livekit-token", {
          body: { listingId: id, role: "seller", name: profile?.full_name || "Seller" },
        });
        if (error || !data?.token) throw new Error(error?.message || "Token failed");
        if (cancelled) return;

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room.on(RoomEvent.ParticipantConnected, () => {
          setViewers(room.numParticipants + 1);
        });
        room.on(RoomEvent.ParticipantDisconnected, () => {
          setViewers(room.numParticipants + 1);
        });

        await room.connect(data.url, data.token);
        await room.localParticipant.enableCameraAndMicrophone();

        const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
        const track = camPub?.videoTrack;
        if (track && videoRef.current) track.attach(videoRef.current);
        setViewers(room.numParticipants + 1);
      } catch (e: any) {
        toast({ title: "Live failed", description: e?.message || "Could not start broadcast", variant: "destructive" });
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();
    return () => {
      cancelled = true;
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [id, profile?.full_name]);

  useEffect(() => {
    const i = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(i);
  }, []);

  // Realtime channel for chat/likes/dislikes/viewers
  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`live:${id}`, {
      config: { presence: { key: profile?.id || "seller" } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setViewers(Object.keys(state).length || 1);
      })
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        setChat(c => [...c, payload as ChatMsg].slice(-50));
      })
      .on("broadcast", { event: "like" }, () => setLikes(l => l + 1))
      .on("broadcast", { event: "dislike" }, () => setDislikes(d => d + 1))
      .on("broadcast", { event: "bid" }, ({ payload }) => {
        const amt = Number((payload as any)?.amount || 0);
        if (amt > 0) {
          setTopBid(prev => Math.max(prev, amt));
          setChat(c => [...c, {
            id: crypto.randomUUID(),
            user: (payload as any)?.user || "Bidder",
            text: `placed bid ₹${amt.toLocaleString()}`,
            kind: "bid" as const,
            ts: Date.now(),
          }].slice(-50));
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ role: "seller", name: profile?.full_name || "Seller" });
          setChat(c => [...c, {
            id: "welcome", user: "System", text: "You're live!", kind: "join", ts: Date.now(),
          }]);
        }
      });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [id, profile?.id, profile?.full_name]);

  useEffect(() => {
    if (listing && listing.status !== "live") {
      updateListing(listing.id, { status: "live", actual_start: new Date().toISOString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  const toggleCam = async () => {
    const lp = roomRef.current?.localParticipant;
    if (!lp) return;
    const next = !camOn;
    await lp.setCameraEnabled(next);
    setCamOn(next);
  };
  const toggleMic = async () => {
    const lp = roomRef.current?.localParticipant;
    if (!lp) return;
    const next = !micOn;
    await lp.setMicrophoneEnabled(next);
    setMicOn(next);
  };
  const toggleAudio = () => {
    const next = !audioOn;
    setAudioOn(next);
    // mute incoming audio tracks
    roomRef.current?.remoteParticipants.forEach(p => {
      p.audioTrackPublications.forEach(pub => {
        (pub.track as any)?.setVolume?.(next ? 1 : 0);
      });
    });
  };

  const sendMessage = () => {
    if (!text.trim() || !channelRef.current) return;
    const msg: ChatMsg = {
      id: crypto.randomUUID(),
      user: profile?.full_name || "Seller",
      text: text.trim(),
      kind: "msg",
      ts: Date.now(),
    };
    channelRef.current.send({ type: "broadcast", event: "chat", payload: msg });
    setChat(c => [...c, msg].slice(-50));
    setText("");
  };

  const endLive = async () => {
    if (!listing) return;
    if (!confirm("End this live session?")) return;
    await updateListing(listing.id, { status: "completed", actual_end: new Date().toISOString() });
    roomRef.current?.disconnect();
    navigate("/dashboard");
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      {starting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {/* Top overlay */}
      <div className="absolute top-0 inset-x-0 p-3 flex items-start justify-between z-10">
        <Button size="icon" variant="ghost" className="rounded-full bg-black/40 hover:bg-black/60 backdrop-blur" onClick={endLive}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 text-white text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {isAuction ? "AUCTION" : "LIVE"} · {viewers} watching
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 text-xs backdrop-blur">
            ⏱ {mm}:{ss}
          </div>
        </div>
      </div>

      {/* Right action rail */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
        <RailButton onClick={toggleAudio} label={audioOn ? "Mute" : "Unmute"}>
          {audioOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-400" />}
        </RailButton>

        <RailButton onClick={() => setShowInfo(true)} label="Details">
          <FileText className="w-5 h-5" />
        </RailButton>

        <RailButton onClick={() => {
          setLikes(l => l + 1);
          channelRef.current?.send({ type: "broadcast", event: "like", payload: {} });
        }} label={String(likes)}>
          <Heart className="w-5 h-5" />
        </RailButton>

        <RailButton onClick={() => {
          setDislikes(d => d + 1);
          channelRef.current?.send({ type: "broadcast", event: "dislike", payload: {} });
        }} label={String(dislikes)}>
          <ThumbsDown className="w-5 h-5" />
        </RailButton>

        {isAuction && (
          <RailButton onClick={() => setShowItems(true)} label="Items">
            <Package className="w-5 h-5" />
          </RailButton>
        )}

        {isAuction && (
          <RailButton onClick={() => setShowWinners(true)} label="Buyers">
            <Trophy className="w-5 h-5" />
          </RailButton>
        )}

        <RailButton onClick={() => {
          const el = document.getElementById("live-chat-input") as HTMLInputElement | null;
          el?.focus();
        }} label="Chat">
          <MessageCircle className="w-5 h-5" />
        </RailButton>
      </div>

      {/* Chat overlay */}
      <div className="absolute left-2 right-20 bottom-32 max-h-56 overflow-y-auto space-y-2 z-10 pr-2 scrollbar-thin">
        {chat.map(m => (
          <div key={m.id} className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/80 flex items-center justify-center text-xs font-bold shrink-0">
              {m.user.charAt(0).toUpperCase()}
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-black/40 backdrop-blur text-sm">
              <span className="font-semibold mr-1">{m.user}</span>
              <span className={m.kind === "bid" ? "text-yellow-300" : ""}>{m.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 p-3 space-y-2 bg-gradient-to-t from-black/80 to-transparent z-10">
        {listing && (
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur rounded-xl p-2 pr-3">
            <div className="w-12 h-12 rounded-lg bg-primary/30 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 truncate">{listing.listing_code}</p>
              <p className="text-sm font-semibold truncate">{listing.title}</p>
            </div>
            {isAuction && topBid > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-white/70">Top Bid</p>
                <p className="text-sm font-bold text-yellow-300">₹{topBid.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            id="live-chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Say something..."
            className="flex-1 rounded-full bg-black/50 border-white/20 text-white placeholder:text-white/60"
          />
          <Button size="icon" className="rounded-full" onClick={sendMessage}>
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full bg-black/40 border-white/20 text-white hover:bg-black/60" onClick={toggleMic}>
            {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-400" />}
          </Button>
          <Button variant="outline" className="rounded-full bg-black/40 border-white/20 text-white hover:bg-black/60" onClick={toggleCam}>
            {camOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-red-400" />}
          </Button>
          <Button variant="destructive" className="rounded-full flex-1" onClick={endLive}>
            End {isAuction ? "Auction" : "Live"}
          </Button>
        </div>
      </div>

      {/* Info dialog: listing + seller */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>{isAuction ? "Auction" : "Live"} Details</DialogTitle>
            <DialogDescription>Session and seller information</DialogDescription>
          </DialogHeader>
          {listing && (
            <div className="space-y-3 text-sm">
              <Section title="Session">
                <Row k="Code" v={listing.listing_code} />
                <Row k="Title" v={listing.title} />
                {listing.description && <Row k="Description" v={listing.description} />}
                <Row k="Type" v={isAuction ? "Auction" : "Live Sale"} />
                <Row k="Status" v={listing.status} />
                {listing.scheduled_start && <Row k="Scheduled" v={new Date(listing.scheduled_start).toLocaleString()} />}
                {listing.actual_start && <Row k="Started" v={new Date(listing.actual_start).toLocaleString()} />}
                <Row k="Viewers" v={String(viewers)} />
                <Row k="Likes / Dislikes" v={`${likes} / ${dislikes}`} />
                {isAuction && topBid > 0 && <Row k="Top Bid" v={`₹${topBid.toLocaleString()}`} />}
              </Section>
              <Section title="Seller">
                <Row icon={<User className="w-3.5 h-3.5" />} k="Name" v={profile?.full_name || "—"} />
                {profile?.email && <Row icon={<Mail className="w-3.5 h-3.5" />} k="Email" v={profile.email} />}
                {profile?.phone && <Row icon={<Phone className="w-3.5 h-3.5" />} k="Phone" v={profile.phone} />}
                {currentShop?.name && <Row k="Shop" v={currentShop.name} />}
                {currentShop?.city && (
                  <Row icon={<MapPin className="w-3.5 h-3.5" />} k="Location" v={[currentShop.city, currentShop.state, currentShop.country].filter(Boolean).join(", ")} />
                )}
              </Section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Items dialog (auction only) */}
      {isAuction && (
        <Dialog open={showItems} onOpenChange={setShowItems}>
          <DialogContent className="w-[calc(100%-1rem)] max-w-md">
            <DialogHeader>
              <DialogTitle>Auction Items</DialogTitle>
              <DialogDescription>{linkedItems.length} item(s) in this auction</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {linkedItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No items linked to this auction.</p>
              )}
              {linkedItems.map((li: any) => (
                <div key={li.id} className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{li.items?.name || "Item"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {li.items?.sku && `SKU: ${li.items.sku}`}
                      {li.quantity != null && ` · Qty: ${li.quantity}`}
                    </p>
                  </div>
                  {li.starting_price != null && (
                    <span className="text-sm font-semibold">₹{Number(li.starting_price).toLocaleString()}</span>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Winners / purchasers dialog (auction only) */}
      {isAuction && (
        <Dialog open={showWinners} onOpenChange={setShowWinners}>
          <DialogContent className="w-[calc(100%-1rem)] max-w-md">
            <DialogHeader>
              <DialogTitle>Auction Buyers</DialogTitle>
              <DialogDescription>{purchasers.length} purchaser(s)</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {purchasers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No purchases yet for this auction.</p>
              )}
              {purchasers.map(o => (
                <div key={o.id} className="p-3 rounded-lg border space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{o.buyer_name || "Buyer"}</p>
                    <span className="text-sm font-bold">₹{Number(o.total).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {o.buyer_email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{o.buyer_email}</p>}
                    {o.buyer_phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{o.buyer_phone}</p>}
                    <p>Order #{o.order_number} · {o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const RailButton = ({ children, onClick, label }: { children: React.ReactNode; onClick?: () => void; label?: string }) => (
  <button
    onClick={onClick}
    className="relative w-11 h-11 rounded-full bg-black/40 backdrop-blur hover:bg-black/60 flex items-center justify-center transition"
  >
    {children}
    {label && <span className="absolute -bottom-4 text-[10px] font-semibold text-white/90">{label}</span>}
  </button>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
    <div className="space-y-1 rounded-lg border p-3">{children}</div>
  </div>
);

const Row = ({ k, v, icon }: { k: string; v: string; icon?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 text-sm">
    <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">{icon}{k}</span>
    <span className="text-right break-words">{v}</span>
  </div>
);

export default LiveBroadcast;
