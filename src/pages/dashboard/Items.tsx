import { motion } from "framer-motion";
import { Plus, Search, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useItems, Item } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { useShop } from "@/contexts/ShopContext";
import { useToast } from "@/hooks/use-toast";
import ItemCard from "@/components/items/ItemCard";
import ItemWizard from "@/components/items/ItemWizard";
import ItemViewModal from "@/components/items/ItemViewModal";
import DuplicateItemDialog, { DuplicateAction } from "@/components/items/DuplicateItemDialog";

const Items = () => {
  const { items, loading, createItem, updateItem, deleteItem } = useItems();
  const { categories, subcategories, getSubcategoriesByCategory } = useCategories();
  const { currentShop } = useShop();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Duplicate detection state
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    itemName: string;
    existingItemId: string;
    pendingData: Partial<Item> | null;
  }>({
    open: false,
    itemName: '',
    existingItemId: '',
    pendingData: null,
  });

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCategoryName = (categoryId: string | null, dimensions?: any) => {
    if (dimensions?.custom_category) {
      return `${dimensions.custom_category} (Custom)`;
    }
    if (!categoryId) return "Uncategorized";
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || "Unknown";
  };

  const getSubcategoryName = (subcategoryId: string | null, dimensions?: any) => {
    if (dimensions?.custom_subcategory) {
      return `${dimensions.custom_subcategory} (Custom)`;
    }
    if (!subcategoryId) return undefined;
    const sub = subcategories.find(s => s.id === subcategoryId);
    return sub?.name;
  };

  const openAddWizard = () => {
    setSelectedItem(null);
    setShowWizard(true);
  };

  const openEditWizard = (item: Item) => {
    setSelectedItem(item);
    setShowWizard(true);
  };

  const openViewModal = (item: Item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  // Check for duplicate item by name
  const findDuplicateItem = (name: string, excludeId?: string): Item | undefined => {
    return items.find(item => 
      item.name.toLowerCase().trim() === name.toLowerCase().trim() &&
      item.id !== excludeId
    );
  };

  const handleSave = async (itemData: Partial<Item>) => {
    // Check for duplicate when creating new item or changing name
    if (!selectedItem) {
      const duplicate = findDuplicateItem(itemData.name || '');
      if (duplicate) {
        setDuplicateDialog({
          open: true,
          itemName: itemData.name || '',
          existingItemId: duplicate.id,
          pendingData: itemData,
        });
        return;
      }
    } else {
      // Editing existing item - check if name changed to a duplicate
      if (itemData.name && itemData.name.toLowerCase().trim() !== selectedItem.name.toLowerCase().trim()) {
        const duplicate = findDuplicateItem(itemData.name, selectedItem.id);
        if (duplicate) {
          setDuplicateDialog({
            open: true,
            itemName: itemData.name,
            existingItemId: duplicate.id,
            pendingData: itemData,
          });
          return;
        }
      }
    }

    await performSave(itemData);
  };

  const performSave = async (itemData: Partial<Item>) => {
    setSaving(true);
    try {
      if (selectedItem) {
        const { error } = await updateItem(selectedItem.id, itemData);
        if (error) throw error;
        toast({ title: "Item updated", description: "Item has been updated successfully." });
      } else {
        const { error } = await createItem(itemData);
        if (error) throw error;
        toast({ title: "Item created", description: "New item has been added to your inventory." });
      }
      setShowWizard(false);
      setSelectedItem(null);
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

  const handleDuplicateAction = async (action: DuplicateAction) => {
    const { existingItemId, pendingData } = duplicateDialog;

    if (action === 'cancel') {
      setDuplicateDialog({ open: false, itemName: '', existingItemId: '', pendingData: null });
      return;
    }

    if (action === 'update') {
      // Update existing item with new data
      setSaving(true);
      try {
        const { error } = await updateItem(existingItemId, pendingData!);
        if (error) throw error;
        toast({ title: "Item updated", description: "Existing item has been updated with new data." });
        setShowWizard(false);
        setSelectedItem(null);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    }

    if (action === 'delete') {
      // Delete existing item then create new
      setSaving(true);
      try {
        const { error: deleteError } = await deleteItem(existingItemId);
        if (deleteError) throw deleteError;

        const { error: createError } = await createItem(pendingData!);
        if (createError) throw createError;

        toast({ title: "Item replaced", description: "Existing item deleted and new item created." });
        setShowWizard(false);
        setSelectedItem(null);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    }

    setDuplicateDialog({ open: false, itemName: '', existingItemId: '', pendingData: null });
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

  const handleEditFromView = () => {
    setShowViewModal(false);
    setShowWizard(true);
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
          <p className="text-muted-foreground">Manage your inventory with variants and images</p>
        </div>
        <Button variant="hero" className="gap-2" onClick={openAddWizard}>
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
          placeholder="Search by name or description..."
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
            Add your first item with parameters, variants, and images.
          </p>
          <Button variant="hero" onClick={openAddWizard}>
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
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <ItemCard
                item={item}
                categoryName={getCategoryName(item.category_id, item.dimensions)}
                subcategoryName={getSubcategoryName(item.subcategory_id, item.dimensions)}
                onEdit={() => openEditWizard(item)}
                onView={() => openViewModal(item)}
                onDelete={() => handleDelete(item.id)}
                deleting={deleting === item.id}
              />
            </motion.div>
          ))}

          {/* Add New Card */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * filteredItems.length }}
            onClick={openAddWizard}
            className="p-5 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-card/30 transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] group"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Add New Item
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* No results */}
      {items.length > 0 && filteredItems.length === 0 && (
        <div className="p-8 rounded-xl bg-card/30 border border-border/30 text-center">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No items match your search.</p>
        </div>
      )}

      {/* Item Wizard */}
      {currentShop && (
        <ItemWizard
          open={showWizard}
          onClose={() => {
            setShowWizard(false);
            setSelectedItem(null);
          }}
          onSave={handleSave}
          item={selectedItem}
          categories={categories}
          getSubcategoriesByCategory={getSubcategoriesByCategory}
          shopId={currentShop.id}
          saving={saving}
        />
      )}

      {/* View Modal */}
      <ItemViewModal
        item={selectedItem}
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedItem(null);
        }}
        categoryName={getCategoryName(selectedItem?.category_id || null, selectedItem?.dimensions)}
        subcategoryName={getSubcategoryName(selectedItem?.subcategory_id || null, selectedItem?.dimensions)}
        onEdit={handleEditFromView}
      />

      {/* Duplicate Item Dialog */}
      <DuplicateItemDialog
        open={duplicateDialog.open}
        itemName={duplicateDialog.itemName}
        existingItemId={duplicateDialog.existingItemId}
        onAction={handleDuplicateAction}
      />
    </div>
  );
};

export default Items;
