import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Loader2, User, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOrderMessages } from "@/hooks/useOrderMessages";
import { useOrders } from "@/hooks/useOrders";
import { format, parseISO } from "date-fns";

const OrderChat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const { orders } = useOrders();
  const { messages, loading, sendMessage } = useOrderMessages(orderId);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const order = orders.find((o) => o.id === orderId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    await sendMessage(newMessage.trim());
    setNewMessage("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!orderId) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        No order selected.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 pb-4 border-b border-border/50"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/orders")}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">
            Chat — {order?.order_number || "Order"}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {order?.buyer_name || "Customer"}{" "}
            {order?.buyer_email && `· ${order.buyer_email}`}
          </p>
        </div>
        {order && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              ₹{order.total.toLocaleString()}
            </span>
            <span>·</span>
            <span className="capitalize">{order.status}</span>
          </div>
        )}
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 px-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, i) => {
            const isSeller = msg.sender_type === "seller";
            const showDate =
              i === 0 ||
              format(parseISO(msg.created_at), "MMM dd") !==
                format(parseISO(messages[i - 1].created_at), "MMM dd");

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      {format(parseISO(msg.created_at), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  className={`flex gap-3 ${isSeller ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarFallback
                      className={
                        isSeller
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary/10 text-secondary"
                      }
                    >
                      {isSeller ? (
                        <Store className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[70%] ${isSeller ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isSeller
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card border border-border/50 text-foreground rounded-tl-sm"
                      }`}
                    >
                      {msg.message}
                    </div>
                    <p
                      className={`text-[10px] text-muted-foreground mt-1 ${
                        isSeller ? "text-right" : "text-left"
                      }`}
                    >
                      {format(parseISO(msg.created_at), "hh:mm a")}
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-4 border-t border-border/50"
      >
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-card/50 border-border/50"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderChat;
