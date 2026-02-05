import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Zap, Package, AlertCircle, Settings2, Trash2, Lock, ImageIcon, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { VariantDetail, Parameter } from '@/hooks/useItems';
import { WizardFormData, ImageItem } from '../ItemWizard';
import VariantImageUploader from './VariantImageUploader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

interface ItemVariantConfigProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
  shopId: string;
}

const ItemVariantConfig = ({ formData, updateFormData, errors, shopId }: ItemVariantConfigProps) => {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Get active parameters with values
  const activeParameters = useMemo(() => 
    formData.parameters.filter(p => p.isActive && p.values.length > 0),
    [formData.parameters]
  );

  // Check if any parameter has more than one LOV value
  const hasMultipleLOVValues = useMemo(() => 
    activeParameters.some(p => p.values.filter(v => v.isActive !== false).length > 1),
    [activeParameters]
  );

  // Check if all parameters have exactly one LOV value
  const allSingleLOV = useMemo(() => 
    activeParameters.length > 0 && 
    activeParameters.every(p => p.values.filter(v => v.isActive !== false).length === 1),
    [activeParameters]
  );

  // Auto-enforce variant mode based on LOV logic
  useEffect(() => {
    if (hasMultipleLOVValues && !formData.hasVariants) {
      // Force variants enabled when any LOV > 1
      updateFormData({ hasVariants: true });
    } else if (allSingleLOV && formData.hasVariants) {
      // Suppress variants when all LOV = 1
      updateFormData({ hasVariants: false, variants: [] });
    }
  }, [hasMultipleLOVValues, allSingleLOV, formData.hasVariants, updateFormData]);

  // Calculate possible combinations
  const possibleCombinations = useMemo(() => {
    if (activeParameters.length === 0) return 0;
    return activeParameters.reduce((acc, p) => acc * p.values.filter(v => v.isActive !== false).length, 1);
  }, [activeParameters]);

  // Calculate total inventory
  const totalQuantity = formData.hasVariants
    ? formData.variants.reduce((sum, v) => sum + v.quantity, 0)
    : formData.singleQuantity;

  const totalReserved = formData.variants.reduce((sum, v) => sum + v.reservedQuantity, 0);
  const totalSold = formData.variants.reduce((sum, v) => sum + v.soldQuantity, 0);
  const totalAvailable = totalQuantity - totalReserved;

  // Generate all variant combinations
  const generateAllVariants = () => {
    if (activeParameters.length === 0) return;

    const newVariants: VariantDetail[] = [];
    
    const generateCombinations = (
      paramIndex: number,
      currentCombination: Record<string, string>
    ) => {
      if (paramIndex >= activeParameters.length) {
        // Check if this combination already exists
        const exists = formData.variants.some(v => {
          return activeParameters.every(p => 
            v.parameterValues[p.id] === currentCombination[p.id]
          );
        });

        if (!exists) {
          newVariants.push({
            id: generateId(),
            parameterValues: { ...currentCombination },
            quantity: 0,
            reservedQuantity: 0,
            soldQuantity: 0,
            isActive: true,
            images: []
          });
        }
        return;
      }

      const param = activeParameters[paramIndex];
      const activeValues = param.values.filter(v => v.isActive !== false);

      for (const value of activeValues) {
        generateCombinations(
          paramIndex + 1,
          { ...currentCombination, [param.id]: value.id }
        );
      }
    };

    generateCombinations(0, {});

    updateFormData({
      variants: [...formData.variants, ...newVariants]
    });
  };

  const addVariant = () => {
    const newVariant: VariantDetail = {
      id: generateId(),
      parameterValues: {},
      quantity: 0,
      reservedQuantity: 0,
      soldQuantity: 0,
      isActive: true,
      images: []
    };
    updateFormData({ variants: [...formData.variants, newVariant] });
  };

  const removeVariant = (id: string) => {
    updateFormData({
      variants: formData.variants.filter(v => v.id !== id)
    });
    if (selectedVariant === id) {
      setSelectedVariant(null);
    }
  };

  const updateVariant = (id: string, updates: Partial<VariantDetail>) => {
    updateFormData({
      variants: formData.variants.map(v =>
        v.id === id ? { ...v, ...updates } : v
      )
    });
  };

  const updateVariantImages = (variantId: string, images: ImageItem[]) => {
    updateFormData({
      variants: formData.variants.map(v =>
        v.id === variantId ? { ...v, images } : v
      )
    });
  };

  const updateVariantParamValue = (variantId: string, paramId: string, valueId: string) => {
    updateFormData({
      variants: formData.variants.map(v =>
        v.id === variantId
          ? { ...v, parameterValues: { ...v.parameterValues, [paramId]: valueId } }
          : v
      )
    });
  };

  const getVariantDisplay = (variant: VariantDetail): string => {
    const parts: string[] = [];
    activeParameters.forEach(p => {
      const valueId = variant.parameterValues[p.id];
      const value = p.values.find(v => v.id === valueId);
      if (value) {
        parts.push(value.value);
      }
    });
    return parts.length > 0 ? parts.join(' / ') : 'Incomplete';
  };

  const getValueById = (param: Parameter, valueId: string) => {
    return param.values.find(v => v.id === valueId);
  };

  const clearAllVariants = () => {
    updateFormData({ variants: [] });
  };

  // Check for duplicate combinations
  const duplicateVariants = useMemo(() => {
    const seen = new Map<string, string[]>();
    formData.variants.forEach(v => {
      const key = activeParameters
        .map(p => v.parameterValues[p.id] || '')
        .join('|');
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push(v.id);
    });
    
    const duplicates = new Set<string>();
    seen.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach(id => duplicates.add(id));
      }
    });
    return duplicates;
  }, [formData.variants, activeParameters]);

  // Determine if variant control should be locked
  const variantControlLocked = hasMultipleLOVValues;
  const variantControlHidden = allSingleLOV || activeParameters.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Variant Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure inventory management. Variants are auto-enabled when parameters have multiple values.
        </p>
      </div>

      {/* Variant Toggle - Conditional display */}
      {!variantControlHidden && (
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <RadioGroup
            value={formData.hasVariants ? 'variants' : 'single'}
            onValueChange={(value) => {
              if (!variantControlLocked) {
                updateFormData({ hasVariants: value === 'variants' });
              }
            }}
            className="space-y-4"
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem 
                value="single" 
                id="single" 
                className="mt-1" 
                disabled={variantControlLocked}
              />
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="single" className={`font-medium cursor-pointer ${variantControlLocked ? 'opacity-50' : ''}`}>
                    Single SKU (No Variants)
                  </Label>
                  {variantControlLocked && (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Item is tracked as a single unit. Parameters are informational only.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RadioGroupItem value="variants" id="variants" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="variants" className="font-medium cursor-pointer">
                  Multiple Variants
                </Label>
                <p className="text-xs text-muted-foreground">
                  Each combination of parameter values is tracked separately.
                  {activeParameters.length > 0 && (
                    <span className="text-primary ml-1">
                      ({possibleCombinations} possible combinations)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </RadioGroup>

          {variantControlLocked && (
            <div className="mt-3 p-2 rounded bg-primary/10 text-xs text-primary flex items-center gap-2">
              <Lock className="w-3 h-3" />
              Variants auto-enabled: One or more parameters have multiple values
            </div>
          )}
        </div>
      )}

      {/* No Parameters Message */}
      {activeParameters.length === 0 && (
        <div className="p-6 rounded-lg border border-border/50 text-center">
          <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="font-medium text-muted-foreground">No parameters defined</p>
          <p className="text-sm text-muted-foreground">
            Go back and add parameters with values to enable variant management
          </p>
        </div>
      )}

      {/* Single SKU Mode */}
      {!formData.hasVariants && activeParameters.length > 0 && (
        <div className="p-6 rounded-lg border border-border/50 space-y-4">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-primary" />
            <h4 className="font-medium">Single Item Quantity</h4>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Available Quantity</Label>
              <Input
                type="number"
                min="0"
                value={formData.singleQuantity}
                onChange={(e) => updateFormData({ singleQuantity: parseInt(e.target.value) || 0 })}
                className={errors.singleQuantity ? 'border-destructive' : ''}
              />
              {errors.singleQuantity && (
                <p className="text-xs text-destructive">{errors.singleQuantity}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Variants Mode */}
      {formData.hasVariants && activeParameters.length > 0 && (
        <>
          {/* Inventory Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">Total Stock</p>
              <p className="text-xl font-bold text-primary">{totalQuantity}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-xl font-bold text-secondary">{totalAvailable}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">Reserved</p>
              <p className="text-xl font-bold">{totalReserved}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">Sold</p>
              <p className="text-xl font-bold">{totalSold}</p>
            </div>
          </div>

          {errors.variants && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.variants}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={generateAllVariants}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Auto-Generate All Combinations
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={addVariant}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Single Variant
            </Button>
            {formData.variants.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={clearAllVariants}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Variants List with Images */}
          {formData.variants.length > 0 ? (
            <div className="space-y-4">
              {formData.variants.map((variant, idx) => {
                const isDuplicate = duplicateVariants.has(variant.id);
                const variantDisplay = getVariantDisplay(variant);
                const isExpanded = selectedVariant === variant.id;
                const variantImages = variant.images || [];

                return (
                  <Collapsible
                    key={variant.id}
                    open={isExpanded}
                    onOpenChange={() => setSelectedVariant(isExpanded ? null : variant.id)}
                  >
                    <div className={`border rounded-lg overflow-hidden ${isDuplicate ? 'border-destructive bg-destructive/5' : 'border-border/50'}`}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {activeParameters.map(param => {
                                const selectedValue = getValueById(param, variant.parameterValues[param.id]);
                                return (
                                  <Select
                                    key={param.id}
                                    value={variant.parameterValues[param.id] || ''}
                                    onValueChange={(v) => {
                                      updateVariantParamValue(variant.id, param.id, v);
                                    }}
                                  >
                                    <SelectTrigger 
                                      className="h-8 text-sm w-auto min-w-[100px]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <SelectValue placeholder={param.name}>
                                        {selectedValue?.value || param.name}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {param.values.filter(v => v.isActive !== false).map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                          {v.value}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Label className="text-xs text-muted-foreground">Qty</Label>
                              <Input
                                type="number"
                                min="0"
                                value={variant.quantity}
                                onChange={(e) => updateVariant(variant.id, { quantity: parseInt(e.target.value) || 0 })}
                                className="h-8 w-20 text-sm"
                              />
                            </div>
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVariant(variant.id);
                              }}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span className="text-xs">Images</span>
                              {variantImages.length > 0 && (
                                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                  {variantImages.length}
                                </span>
                              )}
                            </Button>

                            <Switch
                              checked={variant.isActive}
                              onCheckedChange={(checked) => updateVariant(variant.id, { isActive: checked })}
                              onClick={(e) => e.stopPropagation()}
                            />
                            
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeVariant(variant.id);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="p-4 pt-0 border-t border-border/50 space-y-4">
                          {/* Variant Images */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              Variant Images
                            </Label>
                            <VariantImageUploader
                              variantId={variant.id}
                              variantLabel={variantDisplay}
                              images={variantImages}
                              onChange={(images) => updateVariantImages(variant.id, images)}
                              shopId={shopId}
                            />
                          </div>

                          {/* Additional Fields */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Reserved Quantity</Label>
                              <Input
                                type="number"
                                min="0"
                                value={variant.reservedQuantity}
                                onChange={(e) => updateVariant(variant.id, { reservedQuantity: parseInt(e.target.value) || 0 })}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Price Override (₹)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={variant.priceOverride || ''}
                                onChange={(e) => updateVariant(variant.id, { priceOverride: parseFloat(e.target.value) || undefined })}
                                placeholder="Use base price"
                                className="h-8"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Notes</Label>
                            <Textarea
                              value={variant.notes || ''}
                              onChange={(e) => updateVariant(variant.id, { notes: e.target.value })}
                              placeholder="Optional notes for this variant"
                              rows={2}
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No variants created</p>
              <p className="text-sm">Use "Auto-Generate" or add variants manually</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ItemVariantConfig;
