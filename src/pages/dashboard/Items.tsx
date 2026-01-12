import { motion } from "framer-motion";
import { Plus, Search, Package, Edit, Trash2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const itemsData = [
  { id: 1, name: "Silver Anklet Set", category: "Jewelry", quantity: 15, price: 899, image: "🪙", status: "active" },
  { id: 2, name: "Leather Messenger Bag", category: "Accessories", quantity: 8, price: 2450, image: "👜", status: "active" },
  { id: 3, name: "Handwoven Silk Scarf", category: "Fashion", quantity: 0, price: 1200, image: "🧣", status: "out_of_stock" },
  { id: 4, name: "Brass Candle Holder", category: "Home Decor", quantity: 22, price: 650, image: "🕯️", status: "active" },
  { id: 5, name: "Cotton Block Print Kurti", category: "Fashion", quantity: 5, price: 1800, image: "👗", status: "low_stock" },
];

const Items = () => {
  const [items, setItems] = useState(itemsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", class: "bg-destructive/10 text-destructive" };
    if (quantity <= 5) return { label: "Low Stock", class: "bg-secondary/10 text-secondary" };
    return { label: "In Stock", class: "bg-primary/10 text-primary" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Items</h1>
          <p className="text-muted-foreground">Manage your gallery inventory</p>
        </div>
        <Button variant="hero" className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search items by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card/50 border-border/50"
        />
      </motion.div>

      {/* Items Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredItems.map((item, index) => {
          const status = getStatusBadge(item.status, item.quantity);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="group p-5 rounded-xl bg-card/50 border border-border/50 hover:border-border hover:bg-card/80 transition-all duration-300"
            >
              {/* Image Placeholder */}
              <div className="w-full aspect-square rounded-lg bg-surface-2 flex items-center justify-center mb-4 relative overflow-hidden">
                <span className="text-5xl">{item.image}</span>
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                  <Button variant="glass" size="icon" className="h-10 w-10">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="glass" size="icon" className="h-10 w-10">
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.category}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-bold">₹{item.price.toLocaleString()}</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>{item.quantity} units</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          );
        })}

        {/* Add New Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * filteredItems.length }}
          onClick={() => setShowAddModal(true)}
          className="p-5 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-card/30 transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] group"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">Add New Item</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Items;
