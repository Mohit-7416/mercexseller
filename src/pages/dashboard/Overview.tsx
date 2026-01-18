import { motion } from "framer-motion";
import { Package, Gavel, Clock, Play, Pause, Eye, Edit, TrendingUp, ArrowUpRight, FileText, Calendar, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useListings, Listing } from "@/hooks/useListings";
import { useOrders } from "@/hooks/useOrders";
import { useBids } from "@/hooks/useBids";
import { useProfile } from "@/hooks/useProfile";
import { useCategories } from "@/hooks/useCategories";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";

const Overview = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { categories } = useCategories();
  const { listings, activeListings, liveListings, draftListings, scheduledListings, updateListing, loading: listingsLoading } = useListings();
  const { pendingOrders, loading: ordersLoading } = useOrders();
  const { activeBids, loading: bidsLoading } = useBids();

  const [viewingListing, setViewingListing] = useState<Listing | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const loading = listingsLoading || ordersLoading || bidsLoading;

  const stats = [
    { label: "Pending Orders", value: pendingOrders.length.toString(), icon: Package, color: "primary" },
    { label: "Active Listings", value: activeListings.length.toString(), icon: TrendingUp, color: "secondary" },
    { label: "Active Bids", value: activeBids.length.toString(), icon: Gavel, color: "primary" },
  ];

  const toggleLive = async (id: string, currentStatus: string) => {
    await updateListing(id, { 
      status: currentStatus === 'live' ? 'scheduled' : 'live',
      actual_start: currentStatus === 'live' ? null : new Date().toISOString()
    });
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || "Unknown";
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Seller';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return { label: 'DRAFT', class: 'bg-muted text-muted-foreground' };
      case 'scheduled':
        return { label: 'SCHEDULED', class: 'bg-secondary/10 text-secondary' };
      case 'live':
        return { label: 'LIVE', class: 'bg-primary/10 text-primary' };
      case 'completed':
        return { label: 'COMPLETED', class: 'bg-green-500/10 text-green-500' };
      case 'cancelled':
        return { label: 'CANCELLED', class: 'bg-destructive/10 text-destructive' };
      default:
        return { label: status.toUpperCase(), class: 'bg-muted text-muted-foreground' };
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}! 👋</h1>
        <p className="text-muted-foreground">Here's what's happening with your store today.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                </div>
                <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* All Listings Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Your Listings</h2>
                <p className="text-sm text-muted-foreground">All your drafts, scheduled, and live listings</p>
              </div>
              <Button variant="hero" size="sm" onClick={() => navigate('/dashboard/create')}>Create New</Button>
            </div>

            {listings.length === 0 ? (
              <div className="p-8 rounded-xl bg-card/30 border border-border/30 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No listings yet. Create your first listing to get started!</p>
                <Button variant="hero" onClick={() => navigate('/dashboard/create')}>
                  Create First Listing
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {listings.map((listing, index) => {
                  const statusBadge = getStatusBadge(listing.status);
                  return (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-card/30 border border-border/30 hover:border-border/50 hover:bg-card/50 transition-all"
                    >
                      {listing.status === 'live' && (
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                      )}
                      {listing.status === 'draft' && (
                        <div className="w-3 h-3 rounded-full bg-muted" />
                      )}
                      {listing.status === 'scheduled' && (
                        <div className="w-3 h-3 rounded-full bg-secondary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{listing.listing_code}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.class}`}>
                            {statusBadge.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            listing.type === 'auction' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                          }`}>
                            {listing.type === 'auction' ? 'Auction' : 'Sale'}
                          </span>
                        </div>
                        <h3 className="font-medium truncate">{listing.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{getCategoryName(listing.category_id)}</span>
                          {listing.scheduled_start && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(listing.scheduled_start), 'MMM dd, yyyy HH:mm')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9"
                          onClick={() => setEditingListing(listing)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9"
                          onClick={() => setViewingListing(listing)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(listing.status === 'live' || listing.status === 'scheduled') && (
                          <Button 
                            variant={listing.status === 'live' ? 'destructive' : 'default'}
                            size="icon" 
                            className="h-9 w-9" 
                            onClick={() => toggleLive(listing.id, listing.status)}
                          >
                            {listing.status === 'live' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
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

      {/* View Listing Modal */}
      <Dialog open={!!viewingListing} onOpenChange={() => setViewingListing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Listing Details</DialogTitle>
          </DialogHeader>
          {viewingListing && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{viewingListing.listing_code}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(viewingListing.status).class}`}>
                  {getStatusBadge(viewingListing.status).label}
                </span>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground">Title</label>
                <p className="font-medium">{viewingListing.title}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Type</label>
                <p className="font-medium capitalize">{viewingListing.type === 'live_sale' ? 'Live Sale' : 'Auction'}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Category</label>
                <p className="font-medium">{getCategoryName(viewingListing.category_id)}</p>
              </div>

              {viewingListing.description && (
                <div>
                  <label className="text-sm text-muted-foreground">Description</label>
                  <p className="text-sm">{viewingListing.description}</p>
                </div>
              )}

              {viewingListing.scheduled_start && (
                <div>
                  <label className="text-sm text-muted-foreground">Scheduled Start</label>
                  <p className="font-medium">{format(parseISO(viewingListing.scheduled_start), 'PPpp')}</p>
                </div>
              )}

              {viewingListing.starting_price && (
                <div>
                  <label className="text-sm text-muted-foreground">Starting Price</label>
                  <p className="font-medium">₹{viewingListing.starting_price.toLocaleString()}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground">Created</label>
                <p className="font-medium">{format(parseISO(viewingListing.created_at), 'PPpp')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Listing Modal */}
      <Dialog open={!!editingListing} onOpenChange={() => setEditingListing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>
          {editingListing && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{editingListing.listing_code}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(editingListing.status).class}`}>
                  {getStatusBadge(editingListing.status).label}
                </span>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground">Title</label>
                <p className="font-medium">{editingListing.title}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Type</label>
                <p className="font-medium capitalize">{editingListing.type === 'live_sale' ? 'Live Sale' : 'Auction'}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Category</label>
                <p className="font-medium">{getCategoryName(editingListing.category_id)}</p>
              </div>

              {editingListing.description && (
                <div>
                  <label className="text-sm text-muted-foreground">Description</label>
                  <p className="text-sm">{editingListing.description}</p>
                </div>
              )}

              {editingListing.scheduled_start && (
                <div>
                  <label className="text-sm text-muted-foreground">Scheduled Start</label>
                  <p className="font-medium">{format(parseISO(editingListing.scheduled_start), 'PPpp')}</p>
                </div>
              )}

              <p className="text-sm text-muted-foreground italic">
                Full editing functionality coming soon. You can currently change the status using the controls on the listing card.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Overview;
