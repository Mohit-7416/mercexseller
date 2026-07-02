import { motion } from "framer-motion";
import { Package, Gavel, Clock, Play, Pause, Eye, Edit, TrendingUp, FileText, Calendar, Loader2, Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useListings, Listing } from "@/hooks/useListings";
import { useOrders } from "@/hooks/useOrders";
import { useBids } from "@/hooks/useBids";
import { useProfile } from "@/hooks/useProfile";
import { useCategories } from "@/hooks/useCategories";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import EditListingModal from "@/components/listings/EditListingModal";
import BackButton from "@/components/BackButton";

const ACTIVE_STATUSES = new Set(["draft", "scheduled", "live"]);
const COMPLETED_STATUSES = new Set(["completed", "cancelled"]);

const Overview = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { categories } = useCategories();
  const { listings, activeListings, updateListing, loading: listingsLoading } = useListings();
  const { orders, pendingOrders, loading: ordersLoading } = useOrders();
  const { activeBids, loading: bidsLoading } = useBids();

  const [viewingListing, setViewingListing] = useState<Listing | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [purchasersListing, setPurchasersListing] = useState<Listing | null>(null);
  const [confirmStart, setConfirmStart] = useState<Listing | null>(null);

  const [showCompleted, setShowCompleted] = useState(false);
  const [completedFrom, setCompletedFrom] = useState("");
  const [completedTo, setCompletedTo] = useState("");

  const loading = listingsLoading || ordersLoading || bidsLoading;

  const activeVisible = useMemo(
    () => listings.filter(l => ACTIVE_STATUSES.has(l.status)),
    [listings]
  );

  const completedVisible = useMemo(() => {
    const done = listings.filter(l => COMPLETED_STATUSES.has(l.status));
    if (completedFrom || completedTo) {
      const from = completedFrom ? new Date(completedFrom).getTime() : -Infinity;
      const to = completedTo ? new Date(completedTo).getTime() + 86400000 : Infinity;
      return done.filter(l => {
        const t = new Date(l.updated_at || l.created_at).getTime();
        return t >= from && t <= to;
      });
    }
    return done.slice(0, 10);
  }, [listings, completedFrom, completedTo]);

  const stats = [
    { label: "Pending Orders", value: pendingOrders.length.toString(), icon: Package, color: "primary" },
    { label: "Active Listings", value: activeListings.length.toString(), icon: TrendingUp, color: "secondary" },
    { label: "Active Bids", value: activeBids.length.toString(), icon: Gavel, color: "primary" },
  ];

  const handleGoLive = async (listing: Listing) => {
    await updateListing(listing.id, { status: "live", actual_start: new Date().toISOString() });
    navigate(`/dashboard/live/${listing.id}`);
  };

  const handlePauseLive = async (listing: Listing) => {
    await updateListing(listing.id, { status: "scheduled", actual_start: null });
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || "Unknown";
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Seller';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return { label: 'DRAFT', class: 'bg-muted text-muted-foreground' };
      case 'scheduled': return { label: 'SCHEDULED', class: 'bg-secondary/10 text-secondary' };
      case 'live': return { label: 'LIVE', class: 'bg-primary/10 text-primary' };
      case 'completed': return { label: 'COMPLETED', class: 'bg-green-500/10 text-green-500' };
      case 'cancelled': return { label: 'CANCELLED', class: 'bg-destructive/10 text-destructive' };
      default: return { label: status.toUpperCase(), class: 'bg-muted text-muted-foreground' };
    }
  };

  const purchasers = useMemo(() => {
    if (!purchasersListing) return [];
    return orders.filter(o => o.listing_id === purchasersListing.id);
  }, [purchasersListing, orders]);

  const renderListingRow = (listing: Listing, index: number) => {
    const statusBadge = getStatusBadge(listing.status);
    const isCompleted = COMPLETED_STATUSES.has(listing.status);
    return (
      <motion.div
        key={listing.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.03 * index }}
        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-xl bg-card/30 border border-border/30 hover:border-border/50 hover:bg-card/50 transition-all overflow-hidden"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="pt-1.5 shrink-0">
            {listing.status === 'live' && <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
            {listing.status === 'draft' && <div className="w-2.5 h-2.5 rounded-full bg-muted" />}
            {listing.status === 'scheduled' && <div className="w-2.5 h-2.5 rounded-full bg-secondary" />}
            {isCompleted && <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[11px] font-mono text-muted-foreground">{listing.listing_code}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusBadge.class}`}>
                {statusBadge.label}
              </span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                listing.type === 'auction' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
              }`}>
                {listing.type === 'auction' ? 'Auction' : 'Sale'}
              </span>
            </div>
            <h3 className="font-medium text-sm sm:text-base truncate" title={listing.title}>
              {listing.title}
            </h3>
            {listing.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5" title={listing.description}>
                {listing.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
              <span className="truncate max-w-[120px]">{getCategoryName(listing.category_id)}</span>
              {listing.scheduled_start && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(listing.scheduled_start), 'MMM dd, HH:mm')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {!isCompleted && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingListing(listing)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingListing(listing)}>
            <Eye className="w-4 h-4" />
          </Button>
          {isCompleted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="View purchasers"
              onClick={() => setPurchasersListing(listing)}
            >
              <Users className="w-4 h-4" />
            </Button>
          )}
          {listing.status === 'scheduled' && (
            <Button variant="default" size="icon" className="h-8 w-8" onClick={() => setConfirmStart(listing)}>
              <Play className="w-4 h-4" />
            </Button>
          )}
          {listing.status === 'live' && (
            <>
              <Button variant="default" size="sm" className="h-8" onClick={() => navigate(`/dashboard/live/${listing.id}`)}>
                Join Live
              </Button>
              <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handlePauseLive(listing)}>
                <Pause className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {firstName}! 👋</h1>
        <p className="text-muted-foreground">Here's what's happening with your store today.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-3 sm:p-5 md:p-6 rounded-xl md:rounded-2xl bg-card/50 border border-border/50 hover:border-border hover:bg-card/80 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center ${
                    stat.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'
                  }`}>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${stat.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1">{stat.value}</h3>
                <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Active / Upcoming Listings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Active & Upcoming</h2>
                <p className="text-sm text-muted-foreground">Drafts, scheduled, and live listings</p>
              </div>
              <Button variant="hero" size="sm" onClick={() => navigate('/dashboard/create')} className="w-full sm:w-auto">Create New</Button>
            </div>

            {activeVisible.length === 0 ? (
              <div className="p-8 rounded-xl bg-card/30 border border-border/30 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No active or upcoming listings. Create one to get started!</p>
                <Button variant="hero" onClick={() => navigate('/dashboard/create')}>
                  Create Listing
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {activeVisible.map((listing, i) => renderListingRow(listing, i))}
              </div>
            )}
          </motion.div>

          {/* Completed / Past Listings — only when more than 10 exist */}
          {(() => {
            const completedAll = listings.filter(l => COMPLETED_STATUSES.has(l.status));
            if (completedAll.length <= 10) return null;
            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-xl font-bold">Past Listings</h2>
                    <p className="text-sm text-muted-foreground">{completedAll.length} completed</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowCompleted(s => !s)} className="gap-2">
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCompleted ? "rotate-180" : ""}`} />
                    {showCompleted ? "Hide" : "Show more"}
                  </Button>
                </div>
                {showCompleted && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3 items-end p-3 rounded-xl bg-card/20 border border-border/30">
                      <div className="space-y-1.5">
                        <Label className="text-xs">From</Label>
                        <Input type="date" value={completedFrom} onChange={e => setCompletedFrom(e.target.value)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">To</Label>
                        <Input type="date" value={completedTo} onChange={e => setCompletedTo(e.target.value)} className="h-9" />
                      </div>
                      {(completedFrom || completedTo) && (
                        <Button variant="ghost" size="sm" onClick={() => { setCompletedFrom(""); setCompletedTo(""); }}>
                          Reset
                        </Button>
                      )}
                    </div>
                    {completedVisible.length === 0 ? (
                      <div className="p-8 rounded-xl bg-card/20 border border-border/30 text-center text-sm text-muted-foreground">
                        No past listings in this range.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {completedVisible.map((listing, i) => renderListingRow(listing, i))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })()}

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
        <DialogContent className="w-[calc(100%-1rem)] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Listing Details</DialogTitle>
          </DialogHeader>
          {viewingListing && (
            <div className="space-y-4 py-2">
              {viewingListing.thumbnail_url && (
                <img src={viewingListing.thumbnail_url} alt="" className="w-full h-48 object-cover rounded-lg" />
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{viewingListing.listing_code}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(viewingListing.status).class}`}>
                  {getStatusBadge(viewingListing.status).label}
                </span>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Title</label>
                <p className="font-medium break-words">{viewingListing.title}</p>
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
                  <p className="text-sm break-words whitespace-pre-wrap">{viewingListing.description}</p>
                </div>
              )}
              {viewingListing.scheduled_start && (
                <div>
                  <label className="text-sm text-muted-foreground">Scheduled Start</label>
                  <p className="font-medium">{format(parseISO(viewingListing.scheduled_start), 'PPpp')}</p>
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

      {/* Purchasers Modal */}
      <Dialog open={!!purchasersListing} onOpenChange={() => setPurchasersListing(null)}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchasers — {purchasersListing?.title}</DialogTitle>
          </DialogHeader>
          {purchasers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No purchases recorded for this listing yet.
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {purchasers.map(o => (
                <div key={o.id} className="p-3 rounded-lg border border-border/50 bg-card/30 space-y-2">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{o.buyer_name || 'Buyer'}</p>
                      {o.buyer_email && <p className="text-xs text-muted-foreground truncate">{o.buyer_email}</p>}
                      {o.buyer_phone && <p className="text-xs text-muted-foreground">{o.buyer_phone}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">₹{o.total.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">{o.order_number}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                    <span>Status: <span className="font-medium capitalize">{o.status}</span></span>
                    <span>Date: {format(parseISO(o.created_at), 'MMM dd, yyyy')}</span>
                    {o.payment_method && <span>Paid via {o.payment_method}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Listing Modal */}
      <EditListingModal listing={editingListing} onClose={() => setEditingListing(null)} />

      {/* Confirm Go Live */}
      <AlertDialog open={!!confirmStart} onOpenChange={(o) => !o && setConfirmStart(null)}>
        <AlertDialogContent className="w-[calc(100%-1rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Start this live session?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmStart?.title
                ? `"${confirmStart.title}" will go LIVE now. Buyers can join, chat, and bid in real time. Continue?`
                : 'This listing will go live now. Continue?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmStart) {
                  const l = confirmStart;
                  setConfirmStart(null);
                  handleGoLive(l);
                }
              }}
            >
              Yes, go live
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Overview;
