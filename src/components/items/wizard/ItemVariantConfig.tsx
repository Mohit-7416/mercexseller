import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Zap, Package, AlertCircle, Settings2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { VariantDetail, Parameter } from '@/hooks/useItems';
import { WizardFormData } from '../ItemWizard';
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
}

const ItemVariantConfig = ({ formData, updateFormData, errors }: ItemVariantConfigProps) => {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Get active parameters with values
  const activeParameters = useMemo(() => 
    formData.parameters.filter(p => p.isActive && p.values.length > 0),
    [formData.parameters]
  );

  // Calculate possible combinations
  const possibleCombinations = useMemo(() => {
    if (activeParameters.length === 0) return 0;
    return activeParameters.reduce((acc, p) => acc * p.values.filter(v => v.isActive).length, 1);
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
            isActive: true
          });
        }
        return;
      }

      const param = activeParameters[paramIndex];
      const activeValues = param.values.filter(v => v.isActive);

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
      isActive: true
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Variant Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Choose how to manage inventory: as a single SKU or with multiple variants.
        </p>
      </div>

      {/* Variant Toggle */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
        <RadioGroup
          value={formData.hasVariants ? 'variants' : 'single'}
          onValueChange={(value) => updateFormData({ hasVariants: value === 'variants' })}
          className="space-y-4"
        >
          <div className="flex items-start gap-3">
            <RadioGroupItem value="single" id="single" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="single" className="font-medium cursor-pointer">
                Single SKU (No Variants)
              </Label>
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
      </div>

      {/* Single SKU Mode */}
      {!formData.hasVariants && (
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
      {formData.hasVariants && (
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
          {activeParameters.length > 0 && (
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
          )}

          {/* Variants Table */}
          {formData.variants.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {activeParameters.map(p => (
                      <TableHead key={p.id} className="min-w-[100px]">{p.name}</TableHead>
                    ))}
                    <TableHead className="min-w-[80px]">Qty</TableHead>
                    <TableHead className="min-w-[80px]">Reserved</TableHead>
                    <TableHead className="min-w-[100px]">SKU</TableHead>
                    <TableHead className="w-[60px]">Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.variants.map((variant, idx) => {
                    const isDuplicate = duplicateVariants.has(variant.id);
                    
                    return (
                      <TableRow 
                        key={variant.id}
                        className={isDuplicate ? 'bg-destructive/5' : ''}
                      >
                        {activeParameters.map(param => {
                          const selectedValue = getValueById(param, variant.parameterValues[param.id]);
                          
                          return (
                            <TableCell key={param.id}>
                              <Select
                                value={variant.parameterValues[param.id] || ''}
                                onValueChange={(v) => updateVariantParamValue(variant.id, param.id, v)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select">
                                    {selectedValue && (
                                      <div className="flex items-center gap-2">
                                        {selectedValue.hex && (
                                          <div
                                            className="w-3 h-3 rounded-full border"
                                            style={{ backgroundColor: selectedValue.hex }}
                                          />
                                        )}
                                        <span>{selectedValue.value}</span>
                                      </div>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {param.values.filter(v => v.isActive).map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                      <div className="flex items-center gap-2">
                                        {v.hex && (
                                          <div
                                            className="w-4 h-4 rounded-full border"
                                            style={{ backgroundColor: v.hex }}
                                          />
                                        )}
                                        {v.value}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          );
                        })}
                        
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={variant.quantity}
                            onChange={(e) => updateVariant(variant.id, { quantity: parseInt(e.target.value) || 0 })}
                            className="h-8 w-20 text-sm"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={variant.reservedQuantity}
                            onChange={(e) => updateVariant(variant.id, { reservedQuantity: parseInt(e.target.value) || 0 })}
                            className="h-8 w-20 text-sm"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Input
                            value={variant.skuOverride || ''}
                            onChange={(e) => updateVariant(variant.id, { skuOverride: e.target.value.toUpperCase() })}
                            placeholder={`${formData.sku || 'SKU'}-${idx + 1}`}
                            className="h-8 text-sm font-mono"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Switch
                            checked={variant.isActive}
                            onCheckedChange={(checked) => updateVariant(variant.id, { isActive: checked })}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setSelectedVariant(selectedVariant === variant.id ? null : variant.id)}
                            >
                              <Settings2 className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeVariant(variant.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : activeParameters.length > 0 ? (
            <div className="p-8 rounded-lg border-2 border-dashed border-border/50 text-center">
              <p className="text-muted-foreground mb-4">
                No variants created yet. Use the buttons above to generate or add variants.
              </p>
            </div>
          ) : (
            <div className="p-8 rounded-lg bg-muted/30 text-center">
              <p className="text-muted-foreground">
                Define parameters with values first to create variants.
              </p>
            </div>
          )}

          {/* Variant Details Panel */}
          {selectedVariant && (
            <Collapsible open={true}>
              <CollapsibleContent>
                <div className="p-4 rounded-lg border border-border/50 bg-card/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Variant Details</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setSelectedVariant(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {(() => {
                    const variant = formData.variants.find(v => v.id === selectedVariant);
                    if (!variant) return null;
                    
                    return (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Price Override (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.priceOverride || ''}
                            onChange={(e) => updateVariant(variant.id, { 
                              priceOverride: e.target.value ? parseFloat(e.target.value) : undefined 
                            })}
                            placeholder="Use base price"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Barcode</Label>
                          <Input
                            value={variant.barcode || ''}
                            onChange={(e) => updateVariant(variant.id, { barcode: e.target.value })}
                            placeholder="Optional barcode"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Weight (grams)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variant.weight || ''}
                            onChange={(e) => updateVariant(variant.id, { 
                              weight: e.target.value ? parseFloat(e.target.value) : undefined 
                            })}
                            placeholder="Optional"
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={variant.notes || ''}
                            onChange={(e) => updateVariant(variant.id, { notes: e.target.value })}
                            placeholder="Optional notes for this variant"
                            rows={2}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}
    </div>
  );
};

export default ItemVariantConfig;
