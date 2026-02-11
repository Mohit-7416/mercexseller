import { useState, useMemo } from "react";
import { Search, X, Package, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Item } from "@/hooks/useItems";
import { Category, Subcategory } from "@/hooks/useCategories";

export interface SelectedListingItem {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ListingItemSelectorProps {
  items: Item[];
  categories: Category[];
  subcategories: Subcategory[];
  selectedItems: SelectedListingItem[];
  onAddItem: (item: SelectedListingItem) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

const ListingItemSelector = ({
  items,
  categories,
  subcategories,
  selectedItems,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
}: ListingItemSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");

  const filteredSubcategories = filterCategory
    ? subcategories.filter((s) => s.category_id === filterCategory)
    : [];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const selectedIds = selectedItems.map((s) => s.item_id);
      if (selectedIds.includes(item.id)) return false;
      if (!item.is_active) return false;

      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !filterCategory || item.category_id === filterCategory;

      const matchesSubcategory =
        !filterSubcategory || item.subcategory_id === filterSubcategory;

      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [items, selectedItems, searchQuery, filterCategory, filterSubcategory]);

  const hasActiveFilter = searchQuery.trim() !== "" || filterCategory !== "" || filterSubcategory !== "";

  const getCategoryName = (catId: string | null) =>
    categories.find((c) => c.id === catId)?.name || "";

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Package className="w-4 h-4" />
        Items for this Listing
      </Label>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {selectedItems.length} item(s) selected
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedItems.map((si) => (
              <div
                key={si.item_id}
                className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{si.name}</p>
                  <p className="text-xs text-muted-foreground">₹{si.price}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Input
                    type="number"
                    min={1}
                    value={si.quantity}
                    onChange={(e) =>
                      onUpdateQuantity(si.item_id, parseInt(e.target.value) || 1)
                    }
                    className="w-16 h-8 text-center text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onRemoveItem(si.item_id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3 p-4 rounded-xl bg-card/30 border border-border/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Filter className="w-4 h-4" />
          <span>Search & filter items to add</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card/50 border-border/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            value={filterCategory}
            onValueChange={(val) => {
              setFilterCategory(val === "__all__" ? "" : val);
              setFilterSubcategory("");
            }}
          >
            <SelectTrigger className="bg-card/50 border-border/50">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterSubcategory}
            onValueChange={(val) =>
              setFilterSubcategory(val === "__all__" ? "" : val)
            }
            disabled={!filterCategory}
          >
            <SelectTrigger className="bg-card/50 border-border/50">
              <SelectValue placeholder="All subcategories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All subcategories</SelectItem>
              {filteredSubcategories.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add All & Available Items List — only show after search/filter */}
        {hasActiveFilter && (
          <>
            {filteredItems.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {filteredItems.length} item(s) available
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    filteredItems.forEach((item) =>
                      onAddItem({
                        item_id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: 1,
                      })
                    );
                  }}
                >
                  Add All ({filteredItems.length})
                </Button>
              </div>
            )}

            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items found
                </p>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      onAddItem({
                        item_id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: 1,
                      })
                    }
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          ₹{item.price}
                        </span>
                        {item.category_id && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {getCategoryName(item.category_id)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-primary ml-2">+ Add</span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ListingItemSelector;
