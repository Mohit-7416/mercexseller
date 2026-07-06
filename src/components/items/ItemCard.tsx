import { Package, Edit, Trash2, Eye, Loader2, ImageIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Item, Parameter, VariantDetail } from '@/hooks/useItems';

interface ItemCardProps {
  item: Item;
  categoryName: string;
  subcategoryName?: string;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  deleting: boolean;
}

const ItemCard = ({ 
  item, 
  categoryName, 
  subcategoryName,
  onEdit, 
  onView, 
  onDelete, 
  deleting 
}: ItemCardProps) => {
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
    reservedQuantity: v.reservedQuantity ?? 0,
    soldQuantity: v.soldQuantity ?? 0,
    isActive: v.isActive ?? true
  }));
  
  // Calculate total quantity from variants
  const totalQuantity = variants.length > 0 
    ? variants.reduce((sum, v) => sum + (v.quantity || 0), 0)
    : item.quantity;

  // Get color parameter for display
  const colorParameter = parameters.find(p => p.type === 'color');
  const colorValues = colorParameter?.values || [];

  const getStatusBadge = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", class: "bg-destructive/10 text-destructive" };
    if (quantity <= 5) return { label: "Low Stock", class: "bg-secondary/10 text-secondary" };
    return { label: "In Stock", class: "bg-primary/10 text-primary" };
  };

  const status = getStatusBadge(totalQuantity);
  const images = item.images || [];
  const primaryImage = images[0];

  // Get variant summary
  const getVariantSummary = () => {
    if (variants.length === 0) return null;
    
    const summaryParts: string[] = [];
    parameters.forEach(param => {
      const uniqueValues = new Set<string>();
      variants.forEach(v => {
        const valueId = v.parameterValues[param.id];
        const value = param.values.find(pv => pv.id === valueId);
        if (value) uniqueValues.add(value.value);
      });
      if (uniqueValues.size > 0) {
        summaryParts.push(`${uniqueValues.size} ${param.name}${uniqueValues.size > 1 ? 's' : ''}`);
      }
    });
    return summaryParts.join(' • ');
  };

  const variantSummary = getVariantSummary();

  return (
    <div className="group p-3 sm:p-5 rounded-xl bg-card/50 border border-border/50 hover:border-border hover:bg-card/80 transition-all duration-300">
      {/* Image */}
      <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center mb-2 sm:mb-4 relative overflow-hidden">
        {primaryImage ? (
          <>
            <img 
              src={primaryImage} 
              alt={item.name} 
              className="w-full h-full object-cover" 
            />
            {images.length > 1 && (
              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-background/90 rounded text-[10px] sm:text-xs font-medium flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {images.length}
              </div>
            )}
          </>
        ) : (
          <Package className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
        )}
        
        {/* Hover actions */}
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
          <Button variant="secondary" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={onView}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>


      {/* Info */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold line-clamp-1 text-sm sm:text-base">{item.name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            {(item.dimensions as any)?.listing_type === 'auction' && (
              <span className="px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-xs font-medium bg-primary/15 text-primary">
                Auction
              </span>
            )}
            <span className={`px-1.5 py-0.5 sm:px-2 rounded-full text-[10px] sm:text-xs font-medium ${status.class}`}>
              {status.label}
            </span>
          </div>
        </div>
        
        <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
          {categoryName}
          {subcategoryName && ` / ${subcategoryName}`}
        </div>

        {item.sku && (
          <div className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">
            SKU: {item.sku}
          </div>
        )}

        {/* Parameters summary - hidden on smallest */}
        {parameters.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1 pt-1">
            {parameters.slice(0, 3).map((param) => (
              <span
                key={param.id}
                className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
              >
                {param.name}: {param.values.length}
              </span>
            ))}
            {parameters.length > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                +{parameters.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Color variants preview */}
        {colorValues.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <div className="flex -space-x-1">
              {colorValues.slice(0, 5).map((v, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-background"
                  style={{ backgroundColor: v.hex }}
                  title={v.value}
                />
              ))}
            </div>
            {colorValues.length > 5 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">
                +{colorValues.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Variants info */}
        {variants.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Layers className="w-3 h-3" />
            <span>{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
            {variantSummary && (
              <>
                <span className="text-border">•</span>
                <span className="truncate">{variantSummary}</span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 sm:pt-2 gap-2">
          <span className="text-base sm:text-lg font-bold">₹{item.price.toLocaleString()}</span>
          <div className="flex items-center gap-1 text-[11px] sm:text-sm text-muted-foreground shrink-0">
            <Package className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{totalQuantity}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/30">
        <Button variant="outline" size="sm" className="flex-1 h-8 sm:h-9 px-2 text-xs sm:text-sm" onClick={onView}>
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
          <span className="hidden sm:inline">View</span>
        </Button>
        <Button variant="outline" size="sm" className="flex-1 h-8 sm:h-9 px-2 text-xs sm:text-sm" onClick={onEdit}>
          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>

    </div>
  );
};

export default ItemCard;