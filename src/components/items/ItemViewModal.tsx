import { Package, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Item } from '@/hooks/useItems';
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

  if (!item) return null;

  const images = item.images || [];
  const variants = Array.isArray(item.variants) ? item.variants : [];
  const totalQuantity = variants.length > 0 
    ? variants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0)
    : item.quantity;

  const getStatusBadge = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity <= 5) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const status = getStatusBadge(totalQuantity);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              {images.length > 0 ? (
                <img
                  src={images[selectedImageIndex]}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Package className="w-16 h-16 text-muted-foreground" />
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
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
              <h2 className="text-2xl font-bold">{item.name}</h2>
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
                <p className="text-xl font-bold">₹{item.price.toLocaleString()}</p>
              </div>
              {item.cost_price && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Cost Price</p>
                  <p className="text-xl font-bold">₹{item.cost_price.toLocaleString()}</p>
                </div>
              )}
            </div>

            {item.sku && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">SKU</p>
                <p className="font-mono font-medium">{item.sku}</p>
              </div>
            )}

            {/* Color Variants */}
            {variants.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Color Variants</h3>
                  <span className="text-sm text-muted-foreground">
                    Total: {totalQuantity} units
                  </span>
                </div>
                <div className="space-y-2">
                  {variants.map((v: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <div
                        className="w-8 h-8 rounded-full border border-border shrink-0"
                        style={{ backgroundColor: v.hex }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.hex}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{v.quantity}</p>
                        <p className="text-xs text-muted-foreground">units</p>
                      </div>
                    </div>
                  ))}
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
