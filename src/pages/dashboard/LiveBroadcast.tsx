import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useListings } from "@/hooks/useListings";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Mic, MicOff, Video as VideoIcon, VideoOff,
  Send, Heart, Share2, FileText, Package, Trophy, MessageCircle, Volume2, Loader2,
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
  const listing = listings.find(l => l.id === id);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [starting, setStarting] = useState(true);
  const [viewers, setViewers] = useState(1);
  const [likes, setLikes] = useState(0);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [topBid, setTopBid] = useState<number>(0);

  // Start camera/mic
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e: any) {
        toast({ title: "Camera/Mic blocked", description: e?.message || "Please allow access", variant: "destructive" });
      } finally {
        setStarting(false);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Elapsed timer
  useEffect(() => {
    const i = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(i);
  }, []);

  // Realtime channel for chat/likes/viewers
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
      .on("broadcast", { event: "like" }, () => {
        setLikes(l => l + 1);
      })
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
          // welcome message
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

  // Mark listing live on mount
  useEffect(() => {
    if (listing && listing.status !== "live") {
      updateListing(listing.id, { status: "live", actual_start: new Date().toISOString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  };
  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
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
    streamRef.current?.getTracks().forEach(t => t.stop());
    navigate("/dashboard");
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: listing?.title || "Live", url });
      else { await navigator.clipboard.writeText(url); toast({ title: "Link copied" }); }
    } catch {}
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Video layer */}
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
            LIVE · {viewers}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 text-xs backdrop-blur">
            📣 Explaining · {mm}:{ss}
          </div>
        </div>
      </div>

      {/* Right action rail */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
        <RailButton onClick={() => {}}>
          <Volume2 className="w-5 h-5" />
        </RailButton>
        <RailButton onClick={share}>
          <Share2 className="w-5 h-5" />
        </RailButton>
        <RailButton onClick={() => {}}>
          <FileText className="w-5 h-5" />
        </RailButton>
        <RailButton onClick={() => {
          setLikes(l => l + 1);
          channelRef.current?.send({ type: "broadcast", event: "like", payload: {} });
        }}>
          <Heart className="w-5 h-5" />
          {likes > 0 && <span className="absolute -bottom-5 text-[11px] font-semibold">{likes}</span>}
        </RailButton>
        <RailButton onClick={() => {}}>
          <Package className="w-5 h-5" />
        </RailButton>
        <RailButton onClick={() => {}}>
          <Trophy className="w-5 h-5" />
        </RailButton>
        <RailButton onClick={() => {}}>
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

      {/* Bottom bar: item + input + bid controls */}
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
            {topBid > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-white/70">Top Bid</p>
                <p className="text-sm font-bold text-yellow-300">₹{topBid.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
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
            End Live
          </Button>
        </div>
      </div>
    </div>
  );
};

const RailButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="relative w-11 h-11 rounded-full bg-black/40 backdrop-blur hover:bg-black/60 flex items-center justify-center transition"
  >
    {children}
  </button>
);

export default LiveBroadcast;
