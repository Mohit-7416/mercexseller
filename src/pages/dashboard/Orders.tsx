import { motion } from "framer-motion";
import { Search, Filter, MessageCircle, Calendar, ChevronDown, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useOrders, Order, OrderStatus } from "@/hooks/useOrders";
import { useListings } from "@/hooks/useListings";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import OrderDetailsDialog from "@/components/orders/OrderDetailsDialog";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-secondary/10 text-secondary",
  processing: "bg-primary/10 text-primary",
  shipped: "bg-blue-500/10 text-blue-500",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-muted text-muted-foreground"
};

const Orders = () => {
  const { orders, loading, updateOrderStatus } = useOrders();
  const { listings } = useListings();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter(order => 
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.buyer_name && order.buyer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.buyer_email && order.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleStatusUpdate = async (id: string, status: OrderStatus) => {
    setUpdatingStatus(id);
    try {
      const { error } = await updateOrderStatus(id, status);
      if (error) throw error;
      toast({ title: "Status updated", description: `Order status changed to ${status}.` });
    } catch (error) {
      toast({
        title: "Error updating status",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getListingInfo = (listingId: string | null) => {
    if (!listingId) return null;
    return listings.find(l => l.id === listingId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Orders</h1>
          <p className="text-muted-foreground">Manage and track your customer orders</p>
        </div>
        {selectedOrders.length > 0 && (
          <Button variant="outline" className="gap-2">
            Bulk Update ({selectedOrders.length})
            <ChevronDown className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-4"
      >
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID or Buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card/50 border-border/50"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
        <Button variant="outline" className="gap-2">
          <Calendar className="w-4 h-4" />
          Date Range
        </Button>
      </motion.div>

      {/* Orders Table or Empty State */}
      {orders.length === 0 ? (
        <div className="p-12 rounded-xl bg-card/30 border border-border/30 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
          <p className="text-muted-foreground">
            Orders will appear here when customers make purchases.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border/50 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-card/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(filteredOrders.map(o => o.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Order ID</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Buyer</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Source</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredOrders.map((order, index) => {
                  const listing = getListingInfo(order.listing_id);
                  const isAuction = listing?.type === 'auction';
                  
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="hover:bg-card/30 transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <span className="font-mono text-sm">{order.order_number}</span>
                          {listing && (
                            <span className="block text-xs text-muted-foreground">{listing.listing_code}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <span className="font-medium">{order.buyer_name || 'Unknown'}</span>
                          {order.buyer_email && (
                            <span className="block text-xs text-muted-foreground">{order.buyer_email}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(parseISO(order.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-4 font-semibold">₹{order.total.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          isAuction ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                        }`}>
                          {isAuction ? '🔨 Auction' : '🛒 Sale'}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                          disabled={updatingStatus === order.id}
                          className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[order.status]}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/dashboard/orders/chat?orderId=${order.id}`)}>
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailsOrder(order)}>
                            <Package className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <OrderDetailsDialog
        order={detailsOrder}
        open={!!detailsOrder}
        onOpenChange={(open) => !open && setDetailsOrder(null)}
      />
    </div>
};

export default Orders;
