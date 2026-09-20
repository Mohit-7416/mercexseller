import { motion } from "framer-motion";
import { TrendingUp, Package, DollarSign, BarChart3, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useOrders } from "@/hooks/useOrders";
import { useListings } from "@/hooks/useListings";
import {
  addDays, addMonths, differenceInCalendarDays, endOfDay, endOfMonth, endOfWeek, endOfYear,
  format, isWithinInterval, parseISO, startOfDay, startOfMonth, startOfWeek, startOfYear,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/BackButton";

type ViewType = "auctions" | "sales" | "all";
type Period = "day" | "week" | "month" | "year";

const getPresetRange = (period: Period) => {
  const now = new Date();
  if (period === "day") return { start: startOfDay(now), end: endOfDay(now) };
  if (period === "week") return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  if (period === "month") return { start: startOfMonth(now), end: endOfMonth(now) };
  return { start: startOfYear(now), end: endOfYear(now) };
};

const Analysis = () => {
  const { orders, loading: ordersLoading } = useOrders();
  const { listings, loading: listingsLoading } = useListings();
  
  const [viewType, setViewType] = useState<ViewType>("all");
  const initialRange = getPresetRange("week");
  const [period, setPeriod] = useState<Period>("week");
  const [dateFrom, setDateFrom] = useState(format(initialRange.start, "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(initialRange.end, "yyyy-MM-dd"));

  const loading = ordersLoading || listingsLoading;

  const handlePeriodChange = (nextPeriod: Period) => {
    const range = getPresetRange(nextPeriod);
    setPeriod(nextPeriod);
    setDateFrom(format(range.start, "yyyy-MM-dd"));
    setDateTo(format(range.end, "yyyy-MM-dd"));
  };

  // Process order data for charts
  const { revenueData, itemsSoldData, stats } = useMemo(() => {
    const start = startOfDay(parseISO(dateFrom));
    const end = endOfDay(parseISO(dateTo));
    const safeEnd = end < start ? endOfDay(start) : end;
    const filteredOrders = orders.filter(order => {
      const orderDate = parseISO(order.created_at);
      return isWithinInterval(orderDate, { start, end: safeEnd });
    });

    const dateMap = new Map<string, { auctions: number; sales: number; count: number }>();
    const useMonthlyBuckets = differenceInCalendarDays(safeEnd, start) > 62;
    if (useMonthlyBuckets) {
      for (let date = startOfMonth(start); date <= safeEnd; date = addMonths(date, 1)) {
        dateMap.set(format(date, "yyyy-MM"), { auctions: 0, sales: 0, count: 0 });
      }
    } else {
      for (let date = start; date <= safeEnd; date = addDays(date, 1)) {
        dateMap.set(format(date, "yyyy-MM-dd"), { auctions: 0, sales: 0, count: 0 });
      }
    }

    filteredOrders.forEach(order => {
      const dateKey = format(parseISO(order.created_at), useMonthlyBuckets ? "yyyy-MM" : "yyyy-MM-dd");
      const current = dateMap.get(dateKey) || { auctions: 0, sales: 0, count: 0 };
      const listing = listings.find(l => l.id === order.listing_id);
      const isAuction = listing?.type === "auction";
      dateMap.set(dateKey, {
        auctions: current.auctions + (isAuction ? order.total : 0),
        sales: current.sales + (!isAuction ? order.total : 0),
        count: current.count + 1,
      });
    });

    const revenueData = Array.from(dateMap.entries()).map(([key, data]) => ({
      name: format(parseISO(useMonthlyBuckets ? `${key}-01` : key), useMonthlyBuckets ? "MMM yyyy" : "dd MMM"),
      ...data,
    }));
    const itemsSoldData = revenueData.map(({ name, count }) => ({ name, count }));

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const auctionRevenue = filteredOrders.reduce((sum, o) => {
      const listing = listings.find(l => l.id === o.listing_id);
      return sum + (listing?.type === "auction" ? o.total : 0);
    }, 0);

    return {
      revenueData,
      itemsSoldData,
      stats: {
        totalRevenue,
        auctionRevenue,
        salesRevenue: totalRevenue - auctionRevenue,
        totalItems: filteredOrders.length,
      },
    };
  }, [orders, listings, dateFrom, dateTo]);


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
        <div className="flex items-center gap-2">
          <BackButton />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Analysis</h1>
            <p className="text-muted-foreground">Track your business performance</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-card/40 border border-border/50">
        <div className="space-y-1.5">
          <Label htmlFor="analysis-period">Period</Label>
          <Select value={period} onValueChange={(value) => handlePeriodChange(value as Period)}>
            <SelectTrigger id="analysis-period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="analysis-from">From</Label>
          <Input id="analysis-from" type="date" value={dateFrom} max={dateTo} onChange={(event) => setDateFrom(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="analysis-to">To</Label>
          <Input id="analysis-to" type="date" value={dateTo} min={dateFrom} onChange={(event) => setDateTo(event.target.value)} />
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
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <Button
              variant={viewType === "auctions" ? "default" : "outline"}
              onClick={() => setViewType("auctions")}
              className="flex-1 min-w-[120px]"
            >
              Bid Analysis
            </Button>
            <Button
              variant={viewType === "sales" ? "default" : "outline"}
              onClick={() => setViewType("sales")}
              className="flex-1 min-w-[120px]"
            >
              Live Sales Analysis
            </Button>
            <Button
              variant={viewType === "all" ? "default" : "outline"}
              onClick={() => setViewType("all")}
              className="flex-1 min-w-[120px]"
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
