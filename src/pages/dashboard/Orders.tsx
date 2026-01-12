import { motion } from "framer-motion";
import { Search, Filter, MessageCircle, Calendar, ChevronDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const ordersData = [
  { id: "ORD-8823", buyer: "Priya Sharma", date: "2024-01-10", amount: 2450, source: "Bid", status: "pending", auctionId: "AUC-7842" },
  { id: "ORD-8824", buyer: "Rahul Verma", date: "2024-01-10", amount: 890, source: "Gallery", status: "shipped", auctionId: null },
  { id: "ORD-8825", buyer: "Anita Gupta", date: "2024-01-09", amount: 3200, source: "Bid", status: "delivered", auctionId: "AUC-6551" },
  { id: "ORD-8826", buyer: "Vikram Singh", date: "2024-01-09", amount: 1650, source: "Gallery", status: "pending", auctionId: null },
  { id: "ORD-8827", buyer: "Meera Patel", date: "2024-01-08", amount: 4100, source: "Bid", status: "processing", auctionId: "AUC-7842" },
];

const statusColors = {
  pending: "bg-secondary/10 text-secondary",
  processing: "bg-primary/10 text-primary",
  shipped: "bg-sea-green/10 text-sea-green",
  delivered: "bg-primary/20 text-primary",
};

const Orders = () => {
  const [orders, setOrders] = useState(ordersData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.auctionId && order.auctionId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const updateStatus = (id: string, status: string) => {
    setOrders(prev => prev.map(order => 
      order.id === id ? { ...order, status } : order
    ));
  };

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
            placeholder="Search by Order ID, Auction ID, or Buyer name..."
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

      {/* Orders Table */}
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
              {filteredOrders.map((order, index) => (
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
                      <span className="font-mono text-sm">{order.id}</span>
                      {order.auctionId && (
                        <span className="block text-xs text-muted-foreground">{order.auctionId}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium">{order.buyer}</td>
                  <td className="p-4 text-sm text-muted-foreground">{order.date}</td>
                  <td className="p-4 font-semibold">₹{order.amount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                      order.source === 'Bid' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                    }`}>
                      {order.source === 'Bid' ? '🔨' : '🖼️'} {order.source}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[order.status as keyof typeof statusColors]}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Package className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Orders;
