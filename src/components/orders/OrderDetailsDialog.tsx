import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, User, MapPin, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/hooks/useOrders";
import { format, parseISO } from "date-fns";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  item_id: string | null;
  item?: {
    sku: string | null;
    images: string[] | null;
    description: string | null;
    variants: any;
    dimensions: any;
    category_id: string | null;
  } | null;
}

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockItems = [
  { id: "m1", name: "Gold Necklace 22K", quantity: 1, price: 4500, item_id: null, item: { sku: "GN-001", images: [], description: "22K gold necklace with traditional design", variants: null, dimensions: { weight: "12g" }, category_id: null } },
  { id: "m2", name: "Silver Anklet Pair", quantity: 2, price: 1200, item_id: null, item: { sku: "SA-045", images: [], description: "Pure silver anklets with bell charms", variants: null, dimensions: { weight: "30g" }, category_id: null } },
  { id: "m3", name: "Diamond Stud Earrings", quantity: 1, price: 8500, item_id: null, item: { sku: "DSE-112", images: [], description: "0.5ct diamond studs in white gold setting", variants: null, dimensions: { weight: "3g" }, category_id: null } },
];

const OrderDetailsDialog = ({ order, open, onOpenChange }: OrderDetailsDialogProps) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!order || !open) return;

    const isMock = order.id.startsWith("mock-");
    if (isMock) {
      // Pick 1-3 random mock items for mock orders
      const count = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...mockItems].sort(() => 0.5 - Math.random());
      setItems(shuffled.slice(0, count));
      return;
    }

    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("order_items")
          .select("*, item:items(sku, images, description, variants, dimensions, category_id)")
          .eq("order_id", order.id);

        if (error) throw error;
        setItems((data as any) || []);
      } catch (err) {
        console.error("Error fetching order items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [order, open]);

  if (!order) return null;

  const shippingAddress = order.shipping_address as Record<string, string> | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Order Details — {order.order_number}
          </DialogTitle>
          <DialogDescription>
            Placed on {format(parseISO(order.created_at), "MMM dd, yyyy 'at' hh:mm a")}
          </DialogDescription>
        </DialogHeader>

        {/* Buyer Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" /> Buyer Information
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-3">
            <div>
              <span className="text-muted-foreground">Name</span>
              <p className="font-medium">{order.buyer_name || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email</span>
              <p className="font-medium">{order.buyer_email || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Phone</span>
              <p className="font-medium">{order.buyer_phone || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="mt-0.5 capitalize">{order.status}</Badge>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {shippingAddress && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" /> Shipping Address
              </h3>
              <p className="text-sm bg-muted/30 rounded-lg p-3">
                {[shippingAddress.line, shippingAddress.city, shippingAddress.state, shippingAddress.postal_code, shippingAddress.country]
                  .filter(Boolean)
                  .join(", ") || "No address provided"}
              </p>
            </div>
          </>
        )}

        <Separator />

        {/* Order Items */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Package className="w-4 h-4" /> Items Ordered
          </h3>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No item details available.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      {item.item?.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {item.item.sku}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Qty: {item.quantity}
                    </Badge>
                  </div>

                  {item.item?.description && (
                    <p className="text-sm text-muted-foreground">{item.item.description}</p>
                  )}

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Unit Price: </span>
                      <span className="font-medium">₹{item.price.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Dimensions / Weight */}
                  {item.item?.dimensions && typeof item.item.dimensions === "object" && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {Object.entries(item.item.dimensions as Record<string, string>).map(([key, val]) => (
                        <span key={key} className="capitalize">{key}: {val}</span>
                      ))}
                    </div>
                  )}

                  {/* Variants */}
                  {item.item?.variants && Array.isArray(item.item.variants) && item.item.variants.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(item.item.variants as any[]).slice(0, 5).map((v: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {v.name || v.label || JSON.stringify(v)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Payment Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-4 h-4" /> Payment Summary
          </h3>
          <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>₹{order.shipping_cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>₹{order.tax.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>₹{order.total.toLocaleString()}</span>
            </div>
            {order.payment_method && (
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Payment Method</span>
                <span>{order.payment_method}</span>
              </div>
            )}
            {order.payment_status && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Payment Status</span>
                <Badge variant="outline" className="text-xs capitalize">{order.payment_status}</Badge>
              </div>
            )}
          </div>
        </div>

        {order.notes && (
          <>
            <Separator />
            <div className="text-sm">
              <span className="text-muted-foreground font-semibold">Notes: </span>
              <span>{order.notes}</span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
