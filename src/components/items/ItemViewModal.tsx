import { Package, ImageIcon, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Item, Parameter, VariantDetail } from '@/hooks/useItems';
import { useState } from 'react';

interface ItemViewModalProps {
  item: Item | null;
  open: boolean;
  onClose: () => void;
  categoryName: string;
  subcategoryName?: string;
  onEdit: () => void;
}

const ItemViewModal = ({ 
  item, 
  open, 
  onClose, 
  categoryName, 
  subcategoryName,
  onEdit 
}: ItemViewModalProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  if (!item) return null;

  // Parse data from dimensions
  const dimensions = item.dimensions || {};
  const parameters: Parameter[] = (dimensions.parameters || []).map((p: any, idx: number) => ({
    ...p,
    type: p.type || 'list',
    isActive: p.isActive ?? true,
    order: p.order ?? idx,
    values: (p.values || []).map((v: any) => ({
      ...v,
      isActive: v.isActive ?? true
    }))
  }));
  const variants: VariantDetail[] = (dimensions.variants || []).map((v: any) => ({
    ...v,
    soldQuantity: v.soldQuantity ?? 0,
    isActive: v.isActive ?? true
  }));
  
  const hasVariants = variants.length > 0;
  const singleNotes = dimensions.singleNotes || '';
  const singleImages = dimensions.singleImages || [];
  
  // Get selected variant or first variant
  const selectedVariant = selectedVariantId 
    ? variants.find(v => v.id === selectedVariantId) 
    : variants[0];
  
  // Get images to display - from selected variant or single item
  const displayImages = hasVariants && selectedVariant
    ? (selectedVariant.images || []).map(img => img.url)
    : singleImages.length > 0 
      ? singleImages.map((img: any) => img.url)
      : (item.images || []);

  const totalQuantity = variants.length > 0 
    ? variants.reduce((sum, v) => sum + (v.quantity || 0), 0)
    : item.quantity;

  const getStatusBadge = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity <= 5) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const status = getStatusBadge(totalQuantity);

  // Get variant display string
  const getVariantDisplay = (variant: VariantDetail) => {
    const parts: string[] = [];
    parameters.forEach(p => {
      const valueId = variant.parameterValues[p.id];
      const value = p.values.find(v => v.id === valueId);
      if (value) {
        parts.push(`${p.name}: ${value.value}`);
      }
    });
    return parts.join(' | ');
  };

  // Get current display price
  const displayPrice = hasVariants && selectedVariant?.priceOverride 
    ? selectedVariant.priceOverride 
    : item.price;

  const displayCostPrice = hasVariants && selectedVariant?.costPriceOverride
    ? selectedVariant.costPriceOverride
    : item.cost_price;

  // Get notes to display
  const displayNotes = hasVariants && selectedVariant?.notes
    ? selectedVariant.notes
    : singleNotes;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[calc(100%-1rem)] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Item Details</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Gallery */}
          <div className="space-y-3">
            {/* Main Image */}
            <div className="aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {displayImages.length > 0 ? (
                <img
                  src={displayImages[selectedImageIndex] || displayImages[0]}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Package className="w-16 h-16 text-muted-foreground" />
              )}
            </div>

            {/* Thumbnails */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all
                      ${selectedImageIndex === idx ? 'border-primary' : 'border-border/50 hover:border-border'}
                    `}
                  >
                    <img src={img} alt={`${item.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold break-words pr-6">{item.name}</h2>
              <p className="text-muted-foreground">
                {categoryName}
                {subcategoryName && ` / ${subcategoryName}`}
              </p>
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="text-xl font-bold">₹{displayPrice.toLocaleString()}</p>
                {hasVariants && selectedVariant?.priceOverride && (
                  <p className="text-xs text-primary">Variant override</p>
                )}
              </div>
              {displayCostPrice && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Cost Price</p>
                  <p className="text-xl font-bold">₹{displayCostPrice.toLocaleString()}</p>
                  {hasVariants && selectedVariant?.costPriceOverride && (
                    <p className="text-xs text-primary">Variant override</p>
                  )}
                </div>
              )}
            </div>

            {/* Notes Section */}
            {displayNotes && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium">Notes</p>
                </div>
                <p className="text-sm">{displayNotes}</p>
              </div>
            )}

            {item.sku && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">SKU</p>
                <p className="font-mono font-medium">{item.sku}</p>
              </div>
            )}

            {/* Parameters Section */}
            {parameters.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Parameters</h3>
                <div className="space-y-2">
                  {parameters.map((param) => (
                    <div
                      key={param.id}
                      className="p-3 rounded-lg bg-muted/30"
                    >
                      <p className="text-xs text-muted-foreground mb-2">
                        {param.name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {param.values.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-2 px-2 py-1 rounded-full bg-card border border-border/50"
                          >
                            <span className="text-sm">{v.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variants Section */}
            {variants.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Variants ({variants.length})</h3>
                  <span className="text-sm text-muted-foreground">
                    Total: {totalQuantity} units
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Click on a variant to view its details, images, and notes</p>
                <div className="space-y-2">
                  {variants.map((variant, idx) => {
                    const isSelected = variant.id === (selectedVariant?.id || variants[0].id);
                    const variantImages = variant.images || [];
                    
                    return (
                      <button
                        key={variant.id || idx}
                        onClick={() => {
                          setSelectedVariantId(variant.id);
                          setSelectedImageIndex(0);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                          isSelected 
                            ? 'bg-primary/10 border-2 border-primary' 
                            : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                          {variantImages[0]?.url ? (
                            <img
                              src={variantImages[0].url}
                              alt={getVariantDisplay(variant)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {getVariantDisplay(variant) || `Variant ${idx + 1}`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {variantImages.length > 0 && (
                              <span>{variantImages.length} image{variantImages.length !== 1 ? 's' : ''}</span>
                            )}
                            {variant.priceOverride && (
                              <span>₹{variant.priceOverride}</span>
                            )}
                            {variant.notes && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Has notes
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold">{variant.quantity}</p>
                          <p className="text-xs text-muted-foreground">units</p>
                        </div>
                        {!variant.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Total Stock</p>
                <p className="text-xl font-bold">{item.quantity} units</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
              <p>Created: {new Date(item.created_at).toLocaleString()}</p>
              <p>Updated: {new Date(item.updated_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button variant="hero" className="flex-1" onClick={onEdit}>
              Edit Item
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemViewModal;
