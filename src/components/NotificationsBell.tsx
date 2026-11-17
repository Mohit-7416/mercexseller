import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Gavel,
  MessageCircle,
  MessageSquare,
  Package,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SellerNotification = Database["public"]["Tables"]["seller_notifications"]["Row"];

const notificationIcons: Record<SellerNotification["type"], typeof Bell> = {
  order: Package,
  bid: Gavel,
  order_message: MessageCircle,
  review: Star,
  story_reply: MessageSquare,
  story_reaction: Bell,
};

const NotificationsBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  useEffect(() => {
    const userId = user?.id;
    let active = true;

    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    void supabase
      .from("seller_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Could not load seller notifications:", error);
          toast({ title: "Could not load notifications", description: error.message, variant: "destructive" });
        } else {
          setNotifications(data || []);
        }
        setLoading(false);
      });

    const channel = supabase
      .channel(`seller-notifications-${userId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seller_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!active) return;
          if (payload.eventType === "INSERT") {
            const incoming = payload.new as SellerNotification;
            setNotifications((previous) => {
              if (previous.some((notification) => notification.id === incoming.id)) return previous;
              return [incoming, ...previous].slice(0, 50);
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as SellerNotification;
            setNotifications((previous) => previous.map((notification) =>
              notification.id === updated.id ? updated : notification,
            ));
          } else if (payload.eventType === "DELETE") {
            const removed = payload.old as Partial<SellerNotification>;
            if (removed.id) {
              setNotifications((previous) => previous.filter((notification) => notification.id !== removed.id));
            }
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

  const markRead = async (notification: SellerNotification) => {
    if (!notification.read_at) {
      const readAt = new Date().toISOString();
      const { error } = await supabase
        .from("seller_notifications")
        .update({ read_at: readAt })
        .eq("id", notification.id);

      if (error) {
        toast({ title: "Could not update notification", description: error.message, variant: "destructive" });
        return;
      }

      setNotifications((previous) => previous.map((item) =>
        item.id === notification.id ? { ...item, read_at: readAt } : item,
      ));
    }

    const target = notification.target_path.startsWith("/") && !notification.target_path.startsWith("//")
      ? notification.target_path
      : "/dashboard";
    setOpen(false);
    navigate(target);
  };

  const markAllRead = async () => {
    if (!user || unreadCount === 0 || busy) return;
    setBusy(true);
    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from("seller_notifications")
      .update({ read_at: readAt })
      .eq("user_id", user.id)
      .is("read_at", null);
    setBusy(false);

    if (error) {
      toast({ title: "Could not update notifications", description: error.message, variant: "destructive" });
      return;
    }

    setNotifications((previous) => previous.map((notification) =>
      notification.read_at ? notification : { ...notification, read_at: readAt },
    ));
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("seller_notifications").delete().eq("id", id);
    if (error) {
      toast({ title: "Could not remove notification", description: error.message, variant: "destructive" });
      return;
    }
    setNotifications((previous) => previous.filter((notification) => notification.id !== id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(calc(100vw-2rem),24rem)] p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="font-semibold">Notifications</h2>
            <p className="text-xs text-muted-foreground">
              {unreadCount ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2 text-xs" onClick={() => void markAllRead()} disabled={busy}>
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[min(65vh,26rem)]">
          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading notifications…</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="mt-1 text-xs text-muted-foreground">New shop activity will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                return (
                  <div key={notification.id} className={`flex items-start gap-1 px-2 py-2 ${notification.read_at ? "" : "bg-primary/5"}`}>
                    <Button
                      variant="ghost"
                      className="h-auto min-w-0 flex-1 justify-start gap-3 whitespace-normal px-2 py-2 text-left"
                      onClick={() => void markRead(notification)}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{notification.title}</span>
                          {!notification.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                        </span>
                        <span className="mt-0.5 block break-words text-xs font-normal text-muted-foreground">{notification.message}</span>
                        <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground"
                      onClick={() => void deleteNotification(notification.id)}
                      aria-label={`Delete ${notification.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;