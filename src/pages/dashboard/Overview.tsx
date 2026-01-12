import { motion } from "framer-motion";
import { Package, Gavel, Users, Clock, Play, Pause, Eye, Edit, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const stats = [
  { label: "Pending Orders", value: "24", icon: Package, change: "+12%", color: "primary" },
  { label: "Active Listings", value: "8", icon: TrendingUp, change: "+3", color: "secondary" },
  { label: "Active Bids", value: "156", icon: Gavel, change: "+28%", color: "primary" },
];

const liveListings = [
  { id: "AUC-7842", title: "Vintage Silver Jewelry Set", duration: "1h 23m", viewers: 234, status: "live" },
  { id: "SAL-9123", title: "Handmade Leather Bags Collection", duration: "45m", viewers: 89, status: "live" },
  { id: "AUC-6551", title: "Antique Brass Decor Items", duration: "0m", viewers: 0, status: "scheduled" },
];

const Overview = () => {
  const [listings, setListings] = useState(liveListings);

  const toggleLive = (id: string) => {
    setListings(prev => prev.map(listing => 
      listing.id === id 
        ? { ...listing, status: listing.status === 'live' ? 'scheduled' : 'live' }
        : listing
    ));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="text-muted-foreground">Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-border hover:bg-card/80 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stat.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'
              }`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.color === 'primary' ? 'text-primary' : 'text-secondary'
                }`} />
              </div>
              <span className={`text-sm font-medium flex items-center gap-1 ${
                stat.color === 'primary' ? 'text-primary' : 'text-secondary'
              }`}>
                {stat.change}
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Live Listings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Live Listings</h2>
            <p className="text-sm text-muted-foreground">Manage your active sales and auctions</p>
          </div>
          <Button variant="outline" size="sm">View All</Button>
        </div>

        <div className="grid gap-4">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card/30 border border-border/30 hover:border-border/50 hover:bg-card/50 transition-all duration-300"
            >
              {/* Status Indicator */}
              <div className={`w-3 h-3 rounded-full ${
                listing.status === 'live' ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
              }`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{listing.id}</span>
                  {listing.status === 'live' && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      LIVE
                    </span>
                  )}
                </div>
                <h3 className="font-medium truncate">{listing.title}</h3>
              </div>

              {/* Stats */}
              {listing.status === 'live' && (
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{listing.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{listing.viewers}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant={listing.status === 'live' ? 'destructive' : 'glow'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => toggleLive(listing.id)}
                >
                  {listing.status === 'live' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Create Auction", icon: Gavel, href: "/dashboard/create" },
          { label: "Add Products", icon: Package, href: "/dashboard/items" },
          { label: "View Orders", icon: TrendingUp, href: "/dashboard/orders" },
          { label: "Analytics", icon: Users, href: "/dashboard/analysis" },
        ].map((action) => (
          <button
            key={action.label}
            className="p-4 rounded-xl bg-card/30 border border-border/30 hover:border-primary/30 hover:bg-card/50 transition-all duration-300 text-left group"
          >
            <action.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
};

export default Overview;
