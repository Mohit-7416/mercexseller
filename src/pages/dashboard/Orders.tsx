import { motion } from "framer-motion";
import { Search, Filter, MessageCircle, Calendar, ChevronDown, Package, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { useOrders, Order, OrderStatus } from "@/hooks/useOrders";
import { useListings } from "@/hooks/useListings";
import { useCategories } from "@/hooks/useCategories";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import OrderDetailsDialog from "@/components/orders/OrderDetailsDialog";
import BackButton from "@/components/BackButton";

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
  const { categories } = useCategories();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

  // Advanced filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [fStatus, setFStatus] = useState<string>("all");
  const [fType, setFType] = useState<string>("all"); // all | auction | sale
  const [fCategory, setFCategory] = useState<string>("all");
  const [fMinAmt, setFMinAmt] = useState("");
  const [fMaxAmt, setFMaxAmt] = useState("");
  const [fDateFrom, setFDateFrom] = useState("");
  const [fDateTo, setFDateTo] = useState("");
  const [fCustName, setFCustName] = useState("");
  const [fCustEmail, setFCustEmail] = useState("");
  const [fItem, setFItem] = useState("");

  const resetFilters = () => {
    setFStatus("all"); setFType("all"); setFCategory("all");
    setFMinAmt(""); setFMaxAmt(""); setFDateFrom(""); setFDateTo("");
    setFCustName(""); setFCustEmail(""); setFItem("");
  };

  const activeFilterCount =
    (fStatus !== "all" ? 1 : 0) +
    (fType !== "all" ? 1 : 0) +
    (fCategory !== "all" ? 1 : 0) +
    (fMinAmt ? 1 : 0) + (fMaxAmt ? 1 : 0) +
    (fDateFrom ? 1 : 0) + (fDateTo ? 1 : 0) +
    (fCustName ? 1 : 0) + (fCustEmail ? 1 : 0) +
    (fItem ? 1 : 0);

  const getListingInfo = (listingId: string | null) => {
    if (!listingId) return null;
    return listings.find(l => l.id === listingId);
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const from = fDateFrom ? new Date(fDateFrom).getTime() : -Infinity;
    const to = fDateTo ? new Date(fDateTo).getTime() + 86400000 : Infinity;
    const min = fMinAmt ? parseFloat(fMinAmt) : -Infinity;
    const max = fMaxAmt ? parseFloat(fMaxAmt) : Infinity;

    return orders.filter(order => {
      // free-text search
      if (term) {
        const hay = [order.order_number, order.buyer_name, order.buyer_email]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (fStatus !== "all" && order.status !== fStatus) return false;
      if (fCustName && !(order.buyer_name || "").toLowerCase().includes(fCustName.toLowerCase())) return false;
      if (fCustEmail && !(order.buyer_email || "").toLowerCase().includes(fCustEmail.toLowerCase())) return false;
      if (order.total < min || order.total > max) return false;
      const t = new Date(order.created_at).getTime();
      if (t < from || t > to) return false;

      const listing = getListingInfo(order.listing_id);
      if (fType !== "all") {
        const isAuction = listing?.type === "auction";
        if (fType === "auction" && !isAuction) return false;
        if (fType === "sale" && isAuction) return false;
      }
      if (fCategory !== "all" && listing?.category_id !== fCategory) return false;
      if (fItem && !(listing?.title || "").toLowerCase().includes(fItem.toLowerCase())) return false;
      return true;
    });
  }, [orders, listings, searchTerm, fStatus, fType, fCategory, fMinAmt, fMaxAmt, fDateFrom, fDateTo, fCustName, fCustEmail, fItem]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BackButton />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Orders</h1>
            <p className="text-muted-foreground">Manage and track your customer orders</p>
          </div>
        </div>
        {selectedOrders.length > 0 && (
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            Bulk Update ({selectedOrders.length})
            <ChevronDown className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-3"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID, name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card/50 border-border/50"
          />
        </div>

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(92vw,380px)] p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Filter orders</h4>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={resetFilters}>
                  <X className="w-3 h-3" /> Reset
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Order type</Label>
              <Select value={fType} onValueChange={setFType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Auction &amp; Sales</SelectItem>
                  <SelectItem value="auction">Auction only</SelectItem>
                  <SelectItem value="sale">Sales only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Item category</Label>
              <Select value={fCategory} onValueChange={setFCategory}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Min amount (₹)</Label>
                <Input type="number" value={fMinAmt} onChange={e => setFMinAmt(e.target.value)} className="h-9" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max amount (₹)</Label>
                <Input type="number" value={fMaxAmt} onChange={e => setFMaxAmt(e.target.value)} className="h-9" placeholder="Any" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">From</Label>
                <Input type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To</Label>
                <Input type="date" value={fDateTo} onChange={e => setFDateTo(e.target.value)} className="h-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Customer name</Label>
              <Input value={fCustName} onChange={e => setFCustName(e.target.value)} className="h-9" placeholder="e.g. Rahul" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Customer email</Label>
              <Input value={fCustEmail} onChange={e => setFCustEmail(e.target.value)} className="h-9" placeholder="e.g. name@example.com" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Item / listing title</Label>
              <Input value={fItem} onChange={e => setFItem(e.target.value)} className="h-9" placeholder="e.g. Silk saree" />
            </div>

            <Button className="w-full" onClick={() => setFilterOpen(false)}>Apply</Button>
          </PopoverContent>
        </Popover>
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
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
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

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border/30">
            {filteredOrders.map((order, index) => {
              const listing = getListingInfo(order.listing_id);
              const isAuction = listing?.type === 'auction';
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * index }}
                  className="p-4 space-y-3 bg-card/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="mt-1 rounded border-border"
                      />
                      <div className="min-w-0">
                        <div className="font-mono text-sm truncate">{order.order_number}</div>
                        {listing && (
                          <div className="text-xs text-muted-foreground truncate">{listing.listing_code}</div>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold whitespace-nowrap">₹{order.total.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{order.buyer_name || 'Unknown'}</div>
                      {order.buyer_email && (
                        <div className="text-xs text-muted-foreground truncate">{order.buyer_email}</div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(parseISO(order.created_at), 'MMM dd')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                      isAuction ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                    }`}>
                      {isAuction ? '🔨 Auction' : '🛒 Sale'}
                    </span>
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
                    <div className="ml-auto flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/dashboard/orders/chat?orderId=${order.id}`)}>
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailsOrder(order)}>
                        <Package className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <OrderDetailsDialog
        order={detailsOrder}
        open={!!detailsOrder}
        onOpenChange={(open) => !open && setDetailsOrder(null)}
      />
    </div>
  );
};

export default Orders;
