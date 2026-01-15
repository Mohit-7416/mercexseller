import { motion } from "framer-motion";
import { Package, Gavel, Clock, Play, Pause, Eye, Edit, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useListings } from "@/hooks/useListings";
import { useOrders } from "@/hooks/useOrders";
import { useBids } from "@/hooks/useBids";
import { useProfile } from "@/hooks/useProfile";

const Overview = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { activeListings, liveListings, updateListing, loading: listingsLoading } = useListings();
  const { pendingOrders, loading: ordersLoading } = useOrders();
  const { activeBids, loading: bidsLoading } = useBids();

  const loading = listingsLoading || ordersLoading || bidsLoading;

  const stats = [
    { label: "Pending Orders", value: pendingOrders.length.toString(), icon: Package, change: "", color: "primary" },
    { label: "Active Listings", value: activeListings.length.toString(), icon: TrendingUp, change: "", color: "secondary" },
    { label: "Active Bids", value: activeBids.length.toString(), icon: Gavel, change: "", color: "primary" },
  ];

  const toggleLive = async (id: string, currentStatus: string) => {
    await updateListing(id, { 
      status: currentStatus === 'live' ? 'scheduled' : 'live',
      actual_start: currentStatus === 'live' ? null : new Date().toISOString()
    });
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Seller';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}! 👋</h1>
        <p className="text-muted-foreground">Here's what's happening with your store today.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-border hover:bg-card/80 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    stat.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'
                  }`}>
                    <stat.icon className={`w-6 h-6 ${stat.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
                  </div>
                  {stat.change && (
                    <span className={`text-sm font-medium flex items-center gap-1 ${
                      stat.color === 'primary' ? 'text-primary' : 'text-secondary'
                    }`}>
                      {stat.change}
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Live Listings</h2>
                <p className="text-sm text-muted-foreground">Manage your active sales and auctions</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/create')}>Create New</Button>
            </div>

            {liveListings.length === 0 ? (
              <div className="p-8 rounded-xl bg-card/30 border border-border/30 text-center">
                <p className="text-muted-foreground">No live listings yet. Create your first listing to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {liveListings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card/30 border border-border/30 hover:border-border/50 hover:bg-card/50 transition-all"
                  >
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{listing.listing_code}</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">LIVE</span>
                      </div>
                      <h3 className="font-medium truncate">{listing.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9"><Eye className="w-4 h-4" /></Button>
                      <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => toggleLive(listing.id, listing.status)}>
                        <Pause className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Create Auction", icon: Gavel, href: "/dashboard/create" },
              { label: "Add Products", icon: Package, href: "/dashboard/items" },
              { label: "View Orders", icon: TrendingUp, href: "/dashboard/orders" },
              { label: "Analytics", icon: Clock, href: "/dashboard/analysis" },
            ].map((action) => (
              <button key={action.label} onClick={() => navigate(action.href)} className="p-4 rounded-xl bg-card/30 border border-border/30 hover:border-primary/30 hover:bg-card/50 transition-all text-left group">
                <action.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Overview;
