import { Package, Edit, Trash2, Eye, Loader2, ImageIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Item } from '@/hooks/useItems';
import { Parameter, ParameterValue } from './ParameterDefinition';
import { Variant } from './VariantManager';

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
  const parameters: Parameter[] = dimensions.parameters || [];
  const variants: Variant[] = dimensions.variants || [];
  
  // Calculate total quantity from variants
  const totalQuantity = variants.length > 0 
    ? variants.reduce((sum, v) => sum + (v.quantity || 0), 0)
    : item.quantity;

  // Get color parameter for display
  const colorParameter = parameters.find(p => p.isColor);
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
        const val = v.parameterValues[param.id];
        if (val) uniqueValues.add(val.value);
      });
      if (uniqueValues.size > 0) {
        summaryParts.push(`${uniqueValues.size} ${param.name}${uniqueValues.size > 1 ? 's' : ''}`);
      }
    });
    return summaryParts.join(' • ');
  };

  const variantSummary = getVariantSummary();

  return (
    <div className="group p-5 rounded-xl bg-card/50 border border-border/50 hover:border-border hover:bg-card/80 transition-all duration-300">
      {/* Image */}
      <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center mb-4 relative overflow-hidden">
        {primaryImage ? (
          <>
            <img 
              src={primaryImage} 
              alt={item.name} 
              className="w-full h-full object-cover" 
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/90 rounded text-xs font-medium flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {images.length}
              </div>
            )}
          </>
        ) : (
          <Package className="w-12 h-12 text-muted-foreground" />
        )}
        
        {/* Hover actions */}
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
          <Button variant="secondary" size="icon" className="h-10 w-10" onClick={onView}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="icon" className="h-10 w-10" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold line-clamp-1">{item.name}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${status.class}`}>
            {status.label}
          </span>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {categoryName}
          {subcategoryName && ` / ${subcategoryName}`}
        </div>

        {item.sku && (
          <div className="text-xs text-muted-foreground font-mono">
            SKU: {item.sku}
          </div>
        )}

        {/* Parameters summary */}
        {parameters.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
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
                  className="w-5 h-5 rounded-full border-2 border-background"
                  style={{ backgroundColor: v.hex }}
                  title={v.value}
                />
              ))}
            </div>
            {colorValues.length > 5 && (
              <span className="text-xs text-muted-foreground ml-1">
                +{colorValues.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Variants info */}
        {variants.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
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

        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold">₹{item.price.toLocaleString()}</span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>{totalQuantity} units</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
        <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
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
