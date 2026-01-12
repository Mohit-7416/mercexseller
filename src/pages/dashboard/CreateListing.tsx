import { motion } from "framer-motion";
import { Gavel, ShoppingBag, Upload, Calendar, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const categories = [
  "Jewelry & Accessories",
  "Fashion & Apparel",
  "Home & Decor",
  "Electronics",
  "Art & Collectibles",
  "Books & Media",
  "Sports & Outdoors",
  "Other"
];

const CreateListing = () => {
  const { toast } = useToast();
  const [listingType, setListingType] = useState<'auction' | 'sale' | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    thumbnail: null as File | null,
    date: '',
    time: ''
  });

  const generateId = () => {
    const prefix = listingType === 'auction' ? 'AUC' : 'SAL';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
  };

  const handleSubmit = (asDraft: boolean) => {
    const id = generateId();
    toast({
      title: asDraft ? "Draft saved!" : "Listing created!",
      description: `Your ${listingType} ${id} has been ${asDraft ? 'saved as draft' : 'scheduled'}.`,
    });
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Listing</h1>
        <p className="text-muted-foreground">Set up a new auction or sale for your products</p>
      </div>

      {/* Listing Type Selection */}
      {!listingType ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <button
            onClick={() => setListingType('auction')}
            className="p-8 rounded-2xl bg-card/50 border-2 border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all duration-300 text-left group"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Gavel className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Live Auction</h3>
            <p className="text-muted-foreground text-sm">
              Let buyers compete with real-time bids. Perfect for unique or high-value items.
            </p>
          </button>

          <button
            onClick={() => setListingType('sale')}
            className="p-8 rounded-2xl bg-card/50 border-2 border-border/50 hover:border-secondary/50 hover:bg-card/80 transition-all duration-300 text-left group"
          >
            <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
              <ShoppingBag className="w-7 h-7 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Live Sale</h3>
            <p className="text-muted-foreground text-sm">
              Sell products at fixed prices during live sessions. Great for inventory clearance.
            </p>
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Type Badge */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
              listingType === 'auction' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
            }`}>
              {listingType === 'auction' ? <Gavel className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              <span className="font-medium capitalize">{listingType}</span>
            </div>
            <button
              onClick={() => setListingType(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Change type
            </button>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label>Category</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    formData.category === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card/50 border border-border/50 hover:border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title for your listing"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="bg-card/50 border-border/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what you'll be selling in this session..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-card/50 border-border/50 min-h-[120px]"
            />
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>Thumbnail (Optional)</Label>
            <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-border transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop an image, or click to browse
              </p>
              <Button variant="outline" size="sm">Choose File</Button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-card/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="bg-card/50 border-border/50"
              />
            </div>
          </div>

          {/* Generated ID Preview */}
          <div className="p-4 rounded-xl bg-card/30 border border-border/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>Listing ID will be auto-generated: <code className="text-foreground">{generateId()}</code></span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => handleSubmit(true)} className="flex-1">
              Save as Draft
            </Button>
            <Button variant="hero" onClick={() => handleSubmit(false)} className="flex-1">
              Schedule Listing
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CreateListing;
