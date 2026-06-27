import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Listing, useListings } from "@/hooks/useListings";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
  listing: Listing | null;
  onClose: () => void;
}

const EditListingModal = ({ listing, onClose }: Props) => {
  const { categories, subcategories, getSubcategoriesByCategory } = useCategories();
  const { updateListing } = useListings();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    date: "",
    time: "",
    status: "draft" as Listing["status"],
  });

  useEffect(() => {
    if (!listing) return;
    const sched = listing.scheduled_start ? parseISO(listing.scheduled_start) : null;
    setForm({
      title: listing.title || "",
      description: listing.description || "",
      category_id: listing.category_id || "",
      subcategory_id: listing.subcategory_id || "",
      date: sched ? format(sched, "yyyy-MM-dd") : "",
      time: sched ? format(sched, "HH:mm") : "",
      status: listing.status,
    });
  }, [listing]);

  if (!listing) return null;

  const subs = form.category_id ? getSubcategoriesByCategory(form.category_id) : subcategories;

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    let scheduled_start: string | null = listing.scheduled_start;
    if (form.date && form.time) {
      scheduled_start = new Date(`${form.date}T${form.time}`).toISOString();
    } else if (!form.date && !form.time) {
      scheduled_start = null;
    }
    const { error } = await updateListing(listing.id, {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      scheduled_start,
      status: form.status,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Listing updated" });
    onClose();
  };

  return (
    <Dialog open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{listing.listing_code}</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-muted">{listing.type === "auction" ? "Auction" : "Live Sale"}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea id="edit-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v, subcategory_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select value={form.subcategory_id} onValueChange={(v) => setForm({ ...form, subcategory_id: v })} disabled={!form.category_id}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {subs.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input id="edit-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time">Time</Label>
              <Input id="edit-time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Listing["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditListingModal;
