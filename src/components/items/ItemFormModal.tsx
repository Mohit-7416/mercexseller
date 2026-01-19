import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Item } from '@/hooks/useItems';
import { Category, Subcategory } from '@/hooks/useCategories';
import ImageUploader from './ImageUploader';
import ColorPicker from './ColorPicker';

interface ImageItem {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

interface ColorVariant {
  id: string;
  name: string;
  hex: string;
  quantity: number;
}

interface ItemFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<Item>) => Promise<void>;
  item: Item | null;
  categories: Category[];
  getSubcategoriesByCategory: (categoryId: string) => Subcategory[];
  shopId: string;
  saving: boolean;
}

const OTHERS_ID = 'others';

const ItemFormModal = ({
  open,
  onClose,
  onSave,
  item,
  categories,
  getSubcategoriesByCategory,
  shopId,
  saving
}: ItemFormModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    custom_category: '',
    custom_subcategory: '',
    quantity: '',
    price: '',
    cost_price: '',
    sku: ''
  });

  const [images, setImages] = useState<ImageItem[]>([]);
  const [variants, setVariants] = useState<ColorVariant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      // Parse existing images
      const existingImages: ImageItem[] = (item.images || []).map((url, idx) => ({
        id: `existing-${idx}`,
        url,
        isPrimary: idx === 0,
        order: idx
      }));

      // Parse existing variants
      const existingVariants: ColorVariant[] = Array.isArray(item.variants) 
        ? item.variants.map((v: any, idx: number) => ({
            id: v.id || `variant-${idx}`,
            name: v.name || '',
            hex: v.hex || '#000000',
            quantity: v.quantity || 0
          }))
        : [];

      setFormData({
        name: item.name,
        description: item.description || '',
        category_id: item.category_id || '',
        subcategory_id: item.subcategory_id || '',
        custom_category: '',
        custom_subcategory: '',
        quantity: item.quantity.toString(),
        price: item.price.toString(),
        cost_price: item.cost_price?.toString() || '',
        sku: item.sku || ''
      });
      setImages(existingImages);
      setVariants(existingVariants);
    } else {
      setFormData({
        name: '',
        description: '',
        category_id: '',
        subcategory_id: '',
        custom_category: '',
        custom_subcategory: '',
        quantity: '',
        price: '',
        cost_price: '',
        sku: ''
      });
      setImages([]);
      setVariants([]);
    }
    setErrors({});
  }, [item, open]);

  const subcategories = formData.category_id && formData.category_id !== OTHERS_ID
    ? getSubcategoriesByCategory(formData.category_id)
    : [];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    }

    // Validate variant quantities
    if (variants.length > 0) {
      const missingQty = variants.filter(v => v.quantity <= 0);
      if (missingQty.length > 0) {
        newErrors.variants = `Quantity missing for: ${missingQty.map(v => v.name).join(', ')}`;
      }
    }

    // Custom category validation
    if (formData.category_id === OTHERS_ID && !formData.custom_category.trim()) {
      newErrors.custom_category = 'Please enter custom category name';
    }

    // Custom subcategory validation
    if (formData.subcategory_id === OTHERS_ID && !formData.custom_subcategory.trim()) {
      newErrors.custom_subcategory = 'Please enter custom subcategory name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    // Calculate total quantity from variants or use direct quantity
    const totalQuantity = variants.length > 0
      ? variants.reduce((sum, v) => sum + v.quantity, 0)
      : parseInt(formData.quantity) || 0;

    // Prepare image URLs sorted by order
    const imageUrls = images
      .sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return a.order - b.order;
      })
      .map(img => img.url);

    const itemData: Partial<Item> = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      category_id: formData.category_id === OTHERS_ID ? null : formData.category_id || null,
      subcategory_id: formData.subcategory_id === OTHERS_ID ? null : formData.subcategory_id || null,
      quantity: totalQuantity,
      price: parseFloat(formData.price) || 0,
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      sku: formData.sku.trim() || null,
      images: imageUrls,
      variants: variants.length > 0 ? variants : null,
      dimensions: {
        custom_category: formData.category_id === OTHERS_ID ? formData.custom_category.trim() : null,
        custom_subcategory: formData.subcategory_id === OTHERS_ID ? formData.custom_subcategory.trim() : null
      }
    };

    await onSave(itemData);
  };

  // Generate SKU suggestion based on name and variants
  const generateSKU = () => {
    if (!formData.name.trim()) return;
    
    const namePart = formData.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
    
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    setFormData(prev => ({
      ...prev,
      sku: `${namePart}-${randomPart}`
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Image Upload */}
          <ImageUploader
            images={images}
            onChange={setImages}
            shopId={shopId}
          />

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter item description"
                rows={3}
              />
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    category_id: value,
                    subcategory_id: '',
                    custom_subcategory: ''
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
                    <SelectItem value={OTHERS_ID}>
                      <span className="text-muted-foreground">Others (Custom)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select
                  value={formData.subcategory_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory_id: value }))}
                  disabled={!formData.category_id || formData.category_id === OTHERS_ID}
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
                    <SelectItem value={OTHERS_ID}>
                      <span className="text-muted-foreground">Others (Custom)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Category Input */}
            {formData.category_id === OTHERS_ID && (
              <div className="space-y-2">
                <Label htmlFor="custom_category">Custom Category Name *</Label>
                <Input
                  id="custom_category"
                  value={formData.custom_category}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_category: e.target.value }))}
                  placeholder="Enter custom category name"
                  className={errors.custom_category ? 'border-destructive' : ''}
                />
                {errors.custom_category && (
                  <p className="text-xs text-destructive">{errors.custom_category}</p>
                )}
              </div>
            )}

            {/* Custom Subcategory Input */}
            {formData.subcategory_id === OTHERS_ID && (
              <div className="space-y-2">
                <Label htmlFor="custom_subcategory">Custom Subcategory Name *</Label>
                <Input
                  id="custom_subcategory"
                  value={formData.custom_subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_subcategory: e.target.value }))}
                  placeholder="Enter custom subcategory name"
                  className={errors.custom_subcategory ? 'border-destructive' : ''}
                />
                {errors.custom_subcategory && (
                  <p className="text-xs text-destructive">{errors.custom_subcategory}</p>
                )}
              </div>
            )}
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sku">SKU</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={generateSKU}
              >
                Auto-generate
              </Button>
            </div>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
              placeholder="e.g., SHIRT-RED-M"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for inventory tracking. Can include variant codes.
            </p>
          </div>

          {/* Color Variants */}
          <ColorPicker
            variants={variants}
            onChange={setVariants}
          />
          {errors.variants && (
            <p className="text-xs text-destructive">{errors.variants}</p>
          )}

          {/* Quantity (only if no variants) */}
          {variants.length === 0 && (
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
              />
            </div>
          )}

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0"
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price (₹)</Label>
              <Input
                id="cost_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="hero" className="flex-1" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {item ? 'Update Item' : 'Create Item'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemFormModal;
