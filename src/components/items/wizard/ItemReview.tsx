import { Package, Check, AlertCircle, ImageIcon, Layers, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Parameter } from '@/hooks/useItems';
import { WizardFormData } from '../ItemWizard';
import { Category, Subcategory } from '@/hooks/useCategories';

const OTHERS_ID = 'others';

interface ItemReviewProps {
  formData: WizardFormData;
  categories: Category[];
  getSubcategoriesByCategory: (categoryId: string) => Subcategory[];
}

const ItemReview = ({ formData, categories, getSubcategoriesByCategory }: ItemReviewProps) => {
  const getCategoryName = () => {
    if (formData.category_id === OTHERS_ID) {
      return formData.custom_category;
    }
    return categories.find(c => c.id === formData.category_id)?.name || 'Not selected';
  };

  const getSubcategoryName = () => {
    if (formData.subcategory_id === OTHERS_ID) {
      return formData.custom_subcategory;
    }
    if (!formData.category_id || formData.category_id === OTHERS_ID) return null;
    const subs = getSubcategoriesByCategory(formData.category_id);
    return subs.find(s => s.id === formData.subcategory_id)?.name;
  };

  const totalQuantity = formData.hasVariants
    ? formData.variants.reduce((sum, v) => sum + v.quantity, 0)
    : formData.singleQuantity;

  const totalImages = formData.hasVariants
    ? formData.variants.reduce((sum, v) => sum + (v.images?.length || 0), 0)
    : 0;

  const activeParameters = formData.parameters.filter(p => p.isActive && p.values.length > 0);

  const getVariantDisplay = (variant: typeof formData.variants[0]) => {
    const parts: string[] = [];
    activeParameters.forEach(p => {
      const valueId = variant.parameterValues[p.id];
      const value = p.values.find(v => v.id === valueId);
      if (value) {
        parts.push(value.value);
      }
    });
    return parts.join(' / ');
  };

  // Get primary image from first variant that has images
  const getPrimaryImage = () => {
    if (formData.hasVariants) {
      for (const variant of formData.variants) {
        const variantImages = variant.images || [];
        const primary = variantImages.find(img => img.isPrimary) || variantImages[0];
        if (primary) return primary;
      }
    }
    return null;
  };

  const primaryImage = getPrimaryImage();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
        <Check className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold">Review Your Item</h3>
          <p className="text-sm text-muted-foreground">
            Please review all details before saving.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Image & Basic Info */}
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border/50">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={formData.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No images uploaded</p>
              </div>
            )}
          </div>

          {totalImages > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
              {totalImages} images across variants
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{formData.name || 'Untitled Item'}</h2>
            <p className="text-muted-foreground">
              {getCategoryName()}
              {getSubcategoryName() && ` / ${getSubcategoryName()}`}
            </p>
          </div>

          {formData.description && (
            <p className="text-sm text-muted-foreground">{formData.description}</p>
          )}

          <div className="flex gap-2">
            <Badge variant={formData.isActive ? 'default' : 'secondary'}>
              {formData.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {formData.hasVariants ? (
              <Badge variant="outline">
                <Layers className="w-3 h-3 mr-1" />
                {formData.variants.length} Variants
              </Badge>
            ) : (
              <Badge variant="outline">Single SKU</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground">Selling Price</p>
              <p className="text-lg font-bold">₹{parseFloat(formData.price || '0').toLocaleString()}</p>
            </div>
            {formData.cost_price && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground">Cost Price</p>
                <p className="text-lg font-bold">₹{parseFloat(formData.cost_price).toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Total Stock</p>
            <p className="text-2xl font-bold text-primary">{totalQuantity} units</p>
            <p className="text-xs text-muted-foreground">({formData.unitOfMeasure})</p>
          </div>
        </div>
      </div>

      {/* Parameters Section */}
      {activeParameters.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Parameters ({activeParameters.length})
          </h4>
          <div className="grid gap-3">
            {activeParameters.map((param) => (
              <div
                key={param.id}
                className="p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{param.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {param.type} • {param.values.length} values
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {param.values.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-card border border-border/50 text-sm"
                    >
                      {v.value}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variants Section */}
      {formData.hasVariants && formData.variants.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Variants ({formData.variants.length})
          </h4>
          <div className="grid gap-2 max-h-[300px] overflow-y-auto">
            {formData.variants.map((variant, idx) => {
              const display = getVariantDisplay(variant);
              const variantImages = variant.images || [];
              const primaryVariantImage = variantImages.find(img => img.isPrimary) || variantImages[0];

              return (
                <div
                  key={variant.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    variant.isActive
                      ? 'bg-card/50 border-border/50'
                      : 'bg-muted/30 border-border/30 opacity-60'
                  }`}
                >
                  {/* Variant Image Thumbnail */}
                  <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                    {primaryVariantImage ? (
                      <img
                        src={primaryVariantImage.url}
                        alt={display}
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
                      {display || `Variant ${idx + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {variantImages.length} image{variantImages.length !== 1 ? 's' : ''}
                      {variant.priceOverride && ` • ₹${variant.priceOverride}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{variant.quantity}</p>
                    <p className="text-xs text-muted-foreground">
                      {variant.reservedQuantity > 0 && `${variant.reservedQuantity} reserved`}
                    </p>
                  </div>
                  {!variant.isActive && (
                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation Warnings */}
      {formData.hasVariants && formData.variants.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">No variants created. Add at least one variant to continue.</span>
        </div>
      )}

      {!formData.hasVariants && formData.singleQuantity === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10 text-secondary-foreground">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Quantity is set to 0. The item will show as out of stock.</span>
        </div>
      )}

      {formData.hasVariants && totalImages === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10 text-secondary-foreground">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">No images uploaded for any variant. Consider adding images for better presentation.</span>
        </div>
      )}
    </div>
  );
};

export default ItemReview;
