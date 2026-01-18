import { motion } from "framer-motion";
import { Plus, Search, Package, Edit, Trash2, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useItems, Item } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Items = () => {
  const { items, loading, createItem, updateItem, deleteItem } = useItems();
  const { categories, getSubcategoriesByCategory } = useCategories();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    quantity: '',
    price: '',
    cost_price: '',
    sku: ''
  });

  const subcategories = formData.category_id ? getSubcategoriesByCategory(formData.category_id) : [];

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", class: "bg-destructive/10 text-destructive" };
    if (quantity <= 5) return { label: "Low Stock", class: "bg-secondary/10 text-secondary" };
    return { label: "In Stock", class: "bg-primary/10 text-primary" };
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || "Unknown";
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      category_id: '',
      subcategory_id: '',
      quantity: '',
      price: '',
      cost_price: '',
      sku: ''
    });
    setShowModal(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category_id: item.category_id || '',
      subcategory_id: item.subcategory_id || '',
      quantity: item.quantity.toString(),
      price: item.price.toString(),
      cost_price: item.cost_price?.toString() || '',
      sku: item.sku || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter an item name.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const itemData = {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
        quantity: parseInt(formData.quantity) || 0,
        price: parseFloat(formData.price) || 0,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        sku: formData.sku || null
      };

      if (editingItem) {
        const { error } = await updateItem(editingItem.id, itemData);
        if (error) throw error;
        toast({ title: "Item updated", description: "Item has been updated successfully." });
      } else {
        const { error } = await createItem(itemData);
        if (error) throw error;
        toast({ title: "Item created", description: "New item has been added to your inventory." });
      }
      
      setShowModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await deleteItem(id);
      if (error) throw error;
      toast({ title: "Item deleted", description: "Item has been removed from your inventory." });
    } catch (error) {
      toast({
        title: "Error deleting item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Items</h1>
          <p className="text-muted-foreground">Manage your inventory</p>
        </div>
        <Button variant="hero" className="gap-2" onClick={openAddModal}>
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
          placeholder="Search items by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card/50 border-border/50"
        />
      </motion.div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="p-12 rounded-xl bg-card/30 border border-border/30 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Items Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first item to start building your inventory.
          </p>
          <Button variant="hero" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Item
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredItems.map((item, index) => {
            const status = getStatusBadge(item.quantity);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="group p-5 rounded-xl bg-card/50 border border-border/50 hover:border-border hover:bg-card/80 transition-all duration-300"
              >
                {/* Image Placeholder */}
                <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center mb-4 relative overflow-hidden">
                  {item.images && item.images.length > 0 ? (
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                    <Button variant="secondary" size="icon" className="h-10 w-10" onClick={() => openEditModal(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-10 w-10">
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
                  <p className="text-sm text-muted-foreground">{getCategoryName(item.category_id)}</p>
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
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(item)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                  >
                    {deleting === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
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
            onClick={openAddModal}
            className="p-5 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-card/30 transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] group"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">Add New Item</span>
          </motion.button>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter item description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    category_id: value,
                    subcategory_id: ''
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select
                  value={formData.subcategory_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory_id: value }))}
                  disabled={!formData.category_id || subcategories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Selling Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price (₹)</Label>
                <Input
                  id="cost_price"
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="hero" className="flex-1" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Items;
