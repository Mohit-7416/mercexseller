import { motion } from "framer-motion";
import { TrendingUp, Package, DollarSign, BarChart3 } from "lucide-react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const revenueData = [
  { name: "Mon", auctions: 4200, sales: 2400 },
  { name: "Tue", auctions: 3800, sales: 3100 },
  { name: "Wed", auctions: 5100, sales: 2800 },
  { name: "Thu", auctions: 4700, sales: 3500 },
  { name: "Fri", auctions: 6200, sales: 4100 },
  { name: "Sat", auctions: 8500, sales: 5200 },
  { name: "Sun", auctions: 7200, sales: 4800 },
];

const itemsSoldData = [
  { name: "Mon", count: 12 },
  { name: "Tue", count: 18 },
  { name: "Wed", count: 15 },
  { name: "Thu", count: 22 },
  { name: "Fri", count: 28 },
  { name: "Sat", count: 35 },
  { name: "Sun", count: 30 },
];

const timeRanges = ["Hourly", "Daily", "Weekly", "Monthly", "Yearly"];

const Analysis = () => {
  const [selectedRange, setSelectedRange] = useState("Weekly");
  const [viewType, setViewType] = useState<"auctions" | "sales">("auctions");

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.auctions + d.sales, 0);
  const totalItems = itemsSoldData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analysis</h1>
          <p className="text-muted-foreground">Track your business performance</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 p-1 rounded-lg bg-card/50 border border-border/50">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedRange === range
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `₹${(totalRevenue).toLocaleString()}`, icon: DollarSign, change: "+24%", color: "primary" },
          { label: "Items Sold", value: totalItems, icon: Package, change: "+18%", color: "secondary" },
          { label: "Auction Revenue", value: `₹${revenueData.reduce((s, d) => s + d.auctions, 0).toLocaleString()}`, icon: TrendingUp, change: "+32%", color: "primary" },
          { label: "Sales Revenue", value: `₹${revenueData.reduce((s, d) => s + d.sales, 0).toLocaleString()}`, icon: BarChart3, change: "+12%", color: "secondary" },
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
              <span className={`text-sm font-medium ${stat.color === 'primary' ? 'text-primary' : 'text-secondary'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold">{stat.value}</h3>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
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
            <div className="flex gap-2">
              {(["auctions", "sales"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                    viewType === type
                      ? type === "auctions" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
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
                />
                {viewType === "auctions" ? (
                  <Area
                    type="monotone"
                    dataKey="auctions"
                    stroke="hsl(165, 45%, 40%)"
                    fillOpacity={1}
                    fill="url(#colorAuctions)"
                    strokeWidth={2}
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(32, 65%, 45%)"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Items Sold Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl bg-card/50 border border-border/50"
        >
          <h3 className="text-lg font-semibold mb-6">Items Sold</h3>
          <div className="h-[300px]">
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
                  fill="hsl(165, 45%, 40%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analysis;
