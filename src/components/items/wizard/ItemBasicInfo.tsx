import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Category, Subcategory } from '@/hooks/useCategories';
import { WizardFormData } from '../ItemWizard';



interface ItemBasicInfoProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
  categories: Category[];
  getSubcategoriesByCategory: (categoryId: string) => Subcategory[];
  shopId: string;
}

const ItemBasicInfo = ({
  formData,
  updateFormData,
  errors,
  categories,
  getSubcategoriesByCategory,
}: ItemBasicInfoProps) => {
  const subcategories = formData.category_id
    ? getSubcategoriesByCategory(formData.category_id)
    : [];

  return (
    <div className="space-y-6">
      {/* Basic Info - NO Image Upload here anymore */}
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
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
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Enter item description"
            rows={3}
          />
        </div>
      </div>

      {/* Category & Subcategory */}
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => updateFormData({
                category_id: value,
                subcategory_id: '',
                custom_subcategory: ''
              })}
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
              onValueChange={(value) => updateFormData({ subcategory_id: value })}
              disabled={!formData.category_id}
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

      </div>

      {/* Pricing */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Selling Price (₹) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => updateFormData({ price: e.target.value })}
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
            onChange={(e) => updateFormData({ cost_price: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
        <div>
          <Label className="text-base">Active Status</Label>
          <p className="text-xs text-muted-foreground">
            Inactive items won't appear in listings
          </p>
        </div>
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => updateFormData({ isActive: checked })}
        />
      </div>
    </div>
  );
};

export default ItemBasicInfo;
