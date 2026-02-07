import { useState, useEffect } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Parameter, ParameterValue, VariantDetail } from '@/hooks/useItems';

interface VariantManagerProps {
  parameters: Parameter[];
  variants: VariantDetail[];
  onChange: (variants: VariantDetail[]) => void;
  baseSku?: string;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

const VariantManager = ({ parameters, variants, onChange, baseSku }: VariantManagerProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Parameters that have values
  const activeParameters = parameters.filter(p => p.values.length > 0 && p.isActive);

  const addVariant = () => {
    const newVariant: VariantDetail = {
      id: generateId(),
      parameterValues: {},
      quantity: 0,
      soldQuantity: 0,
      isActive: true
    };

    onChange([...variants, newVariant]);
  };

  const removeVariant = (id: string) => {
    onChange(variants.filter(v => v.id !== id));
  };

  const updateVariantValue = (variantId: string, parameterId: string, valueId: string) => {
    const updatedVariants = variants.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          parameterValues: {
            ...v.parameterValues,
            [parameterId]: valueId
          }
        };
      }
      return v;
    });

    // Check for duplicates
    checkDuplicates(updatedVariants);
    onChange(updatedVariants);
  };

  const updateVariantQuantity = (variantId: string, quantity: number) => {
    onChange(variants.map(v => 
      v.id === variantId ? { ...v, quantity: Math.max(0, quantity) } : v
    ));
  };

  const updateVariantSku = (variantId: string, sku: string) => {
    onChange(variants.map(v => 
      v.id === variantId ? { ...v, skuOverride: sku || undefined } : v
    ));
  };

  const checkDuplicates = (variantsToCheck: VariantDetail[]) => {
    const newErrors: Record<string, string> = {};
    
    for (let i = 0; i < variantsToCheck.length; i++) {
      for (let j = i + 1; j < variantsToCheck.length; j++) {
        const v1 = variantsToCheck[i];
        const v2 = variantsToCheck[j];
        
        // Check if all parameter values match
        const allMatch = activeParameters.every(p => {
          const val1 = v1.parameterValues[p.id];
          const val2 = v2.parameterValues[p.id];
          return val1 && val2 && val1 === val2;
        });

        if (allMatch && Object.keys(v1.parameterValues).length > 0) {
          newErrors[v2.id] = 'Duplicate parameter combination';
        }
      }
    }

    setErrors(newErrors);
  };

  useEffect(() => {
    checkDuplicates(variants);
  }, [variants, activeParameters]);

  const getVariantDisplay = (variant: VariantDetail) => {
    const parts: string[] = [];
    activeParameters.forEach(p => {
      const valueId = variant.parameterValues[p.id];
      const value = p.values.find(v => v.id === valueId);
      if (value) {
        parts.push(value.value);
      }
    });
    return parts.length > 0 ? parts.join(' / ') : 'No values selected';
  };

  const generateVariantSku = (variant: VariantDetail) => {
    if (!baseSku) return '';
    
    const parts = [baseSku];
    activeParameters.forEach(p => {
      const valueId = variant.parameterValues[p.id];
      const value = p.values.find(v => v.id === valueId);
      if (value) {
        parts.push(value.value.substring(0, 3).toUpperCase());
      }
    });
    return parts.join('-');
  };

  const totalQuantity = variants.reduce((sum, v) => sum + v.quantity, 0);

  if (activeParameters.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
        <p className="text-sm text-muted-foreground">
          Add parameter values above to create variants.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Variants</Label>
        <span className="text-sm text-muted-foreground">
          Total Stock: <span className="font-bold text-foreground">{totalQuantity}</span> units
        </span>
      </div>

      {/* Variants List */}
      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div
            key={variant.id}
            className={`p-4 rounded-lg border bg-card/50 space-y-3 ${
              errors[variant.id] ? 'border-destructive' : 'border-border/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Variant {index + 1}</span>
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

            {errors[variant.id] && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="w-3 h-3" />
                {errors[variant.id]}
              </div>
            )}

            {/* Parameter Selectors */}
            <div className="grid gap-3">
              {activeParameters.map((param) => (
                <div key={param.id} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <span className="text-sm text-muted-foreground">{param.name}</span>
                  </div>
                  <Select
                    value={variant.parameterValues[param.id] || '__none__'}
                    onValueChange={(valueId) => {
                      updateVariantValue(variant.id, param.id, valueId === '__none__' ? '' : valueId);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={`Select ${param.name.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">-- Select --</span>
                      </SelectItem>
                      {param.values.filter(v => v.isActive !== false).map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <div className="flex items-center gap-2">
                            {v.hex && (
                              <div
                                className="w-4 h-4 rounded-full border border-border/50"
                                style={{ backgroundColor: v.hex }}
                              />
                            )}
                            {v.value}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Quantity and SKU */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Quantity *</Label>
                <Input
                  type="number"
                  min="0"
                  value={variant.quantity}
                  onChange={(e) => updateVariantQuantity(variant.id, parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className={variant.quantity <= 0 ? 'border-destructive/50' : ''}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">SKU Override</Label>
                <Input
                  value={variant.skuOverride || ''}
                  onChange={(e) => updateVariantSku(variant.id, e.target.value.toUpperCase())}
                  placeholder={generateVariantSku(variant) || 'Optional'}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Variant Preview */}
            <div className="text-xs text-muted-foreground pt-1">
              Preview: {getVariantDisplay(variant)}
            </div>
          </div>
        ))}
      </div>

      {/* Add Variant Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={addVariant}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Variant
      </Button>

      <p className="text-xs text-muted-foreground">
        Each variant represents a unique combination of parameter values with its own quantity.
      </p>
    </div>
  );
};

export default VariantManager;