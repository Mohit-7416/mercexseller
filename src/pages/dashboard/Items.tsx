import { motion } from "framer-motion";
import { Plus, Search, Package, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { useItems, Item } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { useShop } from "@/contexts/ShopContext";
import { useToast } from "@/hooks/use-toast";
import ItemCard from "@/components/items/ItemCard";
import ItemWizard from "@/components/items/ItemWizard";
import ItemViewModal from "@/components/items/ItemViewModal";
import DuplicateItemDialog, { DuplicateAction } from "@/components/items/DuplicateItemDialog";
import ConfirmActionDialog, { ActionType } from "@/components/items/ConfirmActionDialog";
import BackButton from "@/components/BackButton";


const Items = () => {
  const { items, loading, createItem, updateItem, deleteItem } = useItems();
  const { categories, subcategories, getSubcategoriesByCategory } = useCategories();
  const { currentShop } = useShop();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardListingType, setWizardListingType] = useState<'sale' | 'auction'>('sale');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sale' | 'auction'>('sale');

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSubcategory, setFilterSubcategory] = useState<string>("all");
  const [filterMinPrice, setFilterMinPrice] = useState<string>("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");


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

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    actionType: ActionType;
    itemId: string;
    itemName: string;
    pendingData?: Partial<Item>;
  }>({
    open: false,
    actionType: 'delete',
    itemId: '',
    itemName: '',
  });

  const activeFilterCount =
    (filterCategory !== "all" ? 1 : 0) +
    (filterSubcategory !== "all" ? 1 : 0) +
    (filterMinPrice ? 1 : 0) +
    (filterMaxPrice ? 1 : 0) +
    (filterDateFrom ? 1 : 0) +
    (filterDateTo ? 1 : 0);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const itemType = (item.dimensions as any)?.listing_type === 'auction' ? 'auction' : 'sale';
      if (itemType !== activeTab) return false;

      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;

      if (filterCategory !== "all" && item.category_id !== filterCategory) return false;
      if (filterSubcategory !== "all" && item.subcategory_id !== filterSubcategory) return false;

      const min = filterMinPrice ? parseFloat(filterMinPrice) : undefined;
      const max = filterMaxPrice ? parseFloat(filterMaxPrice) : undefined;
      if (min !== undefined && item.price < min) return false;
      if (max !== undefined && item.price > max) return false;

      if (filterDateFrom) {
        const from = new Date(filterDateFrom).getTime();
        if (new Date(item.created_at).getTime() < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo).getTime() + 86400000;
        if (new Date(item.created_at).getTime() > to) return false;
      }

      return true;
    });
  }, [items, searchTerm, filterCategory, filterSubcategory, filterMinPrice, filterMaxPrice, filterDateFrom, filterDateTo, activeTab]);

  const resetFilters = () => {
    setFilterCategory("all");
    setFilterSubcategory("all");
    setFilterMinPrice("");
    setFilterMaxPrice("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const filterSubcategoryList = filterCategory !== "all" ? getSubcategoriesByCategory(filterCategory) : subcategories;


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
    setWizardListingType(activeTab);
    setShowWizard(true);
  };

  const openEditWizard = (item: Item) => {
    setSelectedItem(item);
    const t = (item.dimensions as any)?.listing_type === 'auction' ? 'auction' : 'sale';
    setWizardListingType(t);
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
      // No duplicate, proceed with creation (no confirmation needed for new items)
      await performSave(itemData);
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
      
      // Show update confirmation dialog
      setConfirmDialog({
        open: true,
        actionType: 'update',
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        pendingData: itemData,
      });
    }
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

  // Trigger delete confirmation
  const handleDeleteRequest = (id: string, name: string) => {
    setConfirmDialog({
      open: true,
      actionType: 'delete',
      itemId: id,
      itemName: name,
    });
  };

  // Perform delete after confirmation
  const handleConfirmAction = async () => {
    const { actionType, itemId, pendingData } = confirmDialog;

    if (actionType === 'delete') {
      setDeleting(itemId);
      try {
        const { error } = await deleteItem(itemId);
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
    } else if (actionType === 'update' && pendingData) {
      await performSave(pendingData);
    }

    setConfirmDialog({ open: false, actionType: 'delete', itemId: '', itemName: '' });
  };

  const handleCancelConfirm = () => {
    setConfirmDialog({ open: false, actionType: 'delete', itemId: '', itemName: '' });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <BackButton />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Items</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage your inventory with variants and images</p>
          </div>
        </div>
        <Button variant="hero" className="gap-2 w-full sm:w-auto" onClick={openAddWizard}>
          <Plus className="w-4 h-4" />
          Add {activeTab === 'auction' ? 'Auction' : 'Sale'} Item
        </Button>
      </div>

      {/* Sale / Auction Tabs */}
      <div className="inline-flex p-1 rounded-lg bg-card/50 border border-border/50">
        {(['sale', 'auction'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === t
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'sale' ? 'Sale Items' : 'Auction Items'}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 max-w-xl"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card/50 border-border/50"
          />
        </div>
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 shrink-0 relative">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-h-[70vh] overflow-y-auto scrollbar-thin">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs gap-1">
                    <X className="w-3 h-3" /> Reset
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setFilterSubcategory("all"); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Subcategory</Label>
                <Select value={filterSubcategory} onValueChange={setFilterSubcategory}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subcategories</SelectItem>
                    {filterSubcategoryList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Price range (₹)</Label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Min" value={filterMinPrice} onChange={(e) => setFilterMinPrice(e.target.value)} className="h-9" />
                  <Input type="number" placeholder="Max" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} className="h-9" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Created date</Label>
                <div className="flex gap-2">
                  <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-9" />
                  <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-9" />
                </div>
              </div>

              <Button className="w-full" onClick={() => setFilterOpen(false)}>Apply</Button>
            </div>
          </PopoverContent>
        </Popover>
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
          className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
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
                onDelete={() => handleDeleteRequest(item.id, item.name)}
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
          listingType={wizardListingType}
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

      {/* Confirm Action Dialog (Delete/Update) */}
      <ConfirmActionDialog
        open={confirmDialog.open}
        actionType={confirmDialog.actionType}
        itemName={confirmDialog.itemName}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
        loading={confirmDialog.actionType === 'delete' ? deleting === confirmDialog.itemId : saving}
      />
    </div>
  );
};

export default Items;
