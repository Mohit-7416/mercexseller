import { motion } from "framer-motion";
import { TrendingUp, Package, DollarSign, BarChart3, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useOrders } from "@/hooks/useOrders";
import { useListings } from "@/hooks/useListings";
import { format, subDays, startOfDay, parseISO, isWithinInterval } from "date-fns";
import { Button } from "@/components/ui/button";

type ViewType = "auctions" | "sales" | "all";
type TimeRange = "7days" | "30days" | "90days";

const Analysis = () => {
  const { orders, loading: ordersLoading } = useOrders();
  const { listings, loading: listingsLoading } = useListings();
  
  const [viewType, setViewType] = useState<ViewType>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");

  const loading = ordersLoading || listingsLoading;

  // Get date range based on selected time range
  const getDateRange = () => {
    const end = new Date();
    const days = timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90;
    const start = subDays(end, days);
    return { start, end, days };
  };

  // Process real order data for charts
  const { revenueData, itemsSoldData, stats } = useMemo(() => {
    const { start, end, days } = getDateRange();
    
    // Filter orders within date range
    const filteredOrders = orders.filter(order => {
      const orderDate = parseISO(order.created_at);
      return isWithinInterval(orderDate, { start, end });
    });

    // Group orders by date
    const dateMap = new Map<string, { auctions: number; sales: number; count: number }>();
    
    // Initialize all dates in range
    for (let i = 0; i < Math.min(days, 7); i++) {
      const date = subDays(end, i);
      const dateKey = format(date, "EEE");
      dateMap.set(dateKey, { auctions: 0, sales: 0, count: 0 });
    }

    // Aggregate order data
    filteredOrders.forEach(order => {
      const dateKey = format(parseISO(order.created_at), "EEE");
      const current = dateMap.get(dateKey) || { auctions: 0, sales: 0, count: 0 };
      
      // Determine if order is from auction or sale based on listing
      const listing = listings.find(l => l.id === order.listing_id);
      const isAuction = listing?.type === "auction";
      
      dateMap.set(dateKey, {
        auctions: current.auctions + (isAuction ? order.total : 0),
        sales: current.sales + (!isAuction ? order.total : 0),
        count: current.count + 1
      });
    });

    // Convert to array for charts
    const revenueData = Array.from(dateMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .reverse();

    const itemsSoldData = Array.from(dateMap.entries())
      .map(([name, data]) => ({ name, count: data.count }))
      .reverse();

    // Calculate totals
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const auctionRevenue = filteredOrders.reduce((sum, o) => {
      const listing = listings.find(l => l.id === o.listing_id);
      return sum + (listing?.type === "auction" ? o.total : 0);
    }, 0);
    const salesRevenue = totalRevenue - auctionRevenue;
    const totalItems = filteredOrders.length;

    const stats = {
      totalRevenue,
      auctionRevenue,
      salesRevenue,
      totalItems
    };

    return { revenueData, itemsSoldData, stats };
  }, [orders, listings, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = orders.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analysis</h1>
          <p className="text-muted-foreground">Track your business performance</p>
        </div>

        {/* View Type Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 p-1 rounded-lg bg-card/50 border border-border/50">
            {(["7days", "30days", "90days"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range === "7days" ? "7 Days" : range === "30days" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="p-12 rounded-xl bg-card/30 border border-border/30 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            Analytics will appear here once you have completed orders.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "primary" },
              { label: "Orders", value: stats.totalItems.toString(), icon: Package, color: "secondary" },
              { label: "Auction Revenue", value: `₹${stats.auctionRevenue.toLocaleString()}`, icon: TrendingUp, color: "primary" },
              { label: "Sales Revenue", value: `₹${stats.salesRevenue.toLocaleString()}`, icon: BarChart3, color: "secondary" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-5 rounded-xl bg-card/50 border border-border/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    stat.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'
                  }`}>
                    <stat.icon className={`w-5 h-5 ${stat.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Analysis Type Buttons */}
          <div className="flex gap-4">
            <Button
              variant={viewType === "auctions" ? "default" : "outline"}
              onClick={() => setViewType("auctions")}
              className="flex-1"
            >
              Bid Analysis
            </Button>
            <Button
              variant={viewType === "sales" ? "default" : "outline"}
              onClick={() => setViewType("sales")}
              className="flex-1"
            >
              Live Sales Analysis
            </Button>
            <Button
              variant={viewType === "all" ? "default" : "outline"}
              onClick={() => setViewType("all")}
              className="flex-1"
            >
              Combined View
            </Button>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-xl bg-card/50 border border-border/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Revenue Overview</h3>
                <span className="text-sm text-muted-foreground capitalize">
                  {viewType === "all" ? "All Sources" : viewType}
                </span>
              </div>
              <div className="h-[300px]">
                {revenueData.every(d => d.auctions === 0 && d.sales === 0) ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No revenue data for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorAuctions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(165, 45%, 40%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(165, 45%, 40%)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(32, 65%, 45%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(32, 65%, 45%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                      <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(220, 20%, 10%)",
                          border: "1px solid hsl(220, 15%, 18%)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                      />
                      {(viewType === "auctions" || viewType === "all") && (
                        <Area
                          type="monotone"
                          dataKey="auctions"
                          name="Auctions"
                          stroke="hsl(165, 45%, 40%)"
                          fillOpacity={1}
                          fill="url(#colorAuctions)"
                          strokeWidth={2}
                        />
                      )}
                      {(viewType === "sales" || viewType === "all") && (
                        <Area
                          type="monotone"
                          dataKey="sales"
                          name="Sales"
                          stroke="hsl(32, 65%, 45%)"
                          fillOpacity={1}
                          fill="url(#colorSales)"
                          strokeWidth={2}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Orders Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-xl bg-card/50 border border-border/50"
            >
              <h3 className="text-lg font-semibold mb-6">Orders Completed</h3>
              <div className="h-[300px]">
                {itemsSoldData.every(d => d.count === 0) ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No orders for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={itemsSoldData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                      <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(220, 20%, 10%)",
                          border: "1px solid hsl(220, 15%, 18%)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Orders"
                        fill="hsl(165, 45%, 40%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analysis;
