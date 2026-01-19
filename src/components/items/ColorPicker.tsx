import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColorVariant {
  id: string;
  name: string;
  hex: string;
  quantity: number;
}

interface ColorPickerProps {
  variants: ColorVariant[];
  onChange: (variants: ColorVariant[]) => void;
}

const PREDEFINED_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Maroon', hex: '#7F1D1D' },
  { name: 'Beige', hex: '#D4A574' },
  { name: 'Olive', hex: '#556B2F' },
];

const ColorPicker = ({ variants, onChange }: ColorPickerProps) => {
  const [customName, setCustomName] = useState('');
  const [customHex, setCustomHex] = useState('#000000');
  const [showCustom, setShowCustom] = useState(false);

  const addColor = (name: string, hex: string) => {
    // Check if color already exists
    if (variants.some(v => v.hex.toLowerCase() === hex.toLowerCase())) {
      return;
    }

    const newVariant: ColorVariant = {
      id: `color-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name,
      hex,
      quantity: 0
    };

    onChange([...variants, newVariant]);
  };

  const addCustomColor = () => {
    if (!customName.trim()) return;
    addColor(customName.trim(), customHex);
    setCustomName('');
    setCustomHex('#000000');
    setShowCustom(false);
  };

  const removeVariant = (id: string) => {
    onChange(variants.filter(v => v.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    onChange(variants.map(v => 
      v.id === id ? { ...v, quantity: Math.max(0, quantity) } : v
    ));
  };

  const isColorSelected = (hex: string) => {
    return variants.some(v => v.hex.toLowerCase() === hex.toLowerCase());
  };

  const totalQuantity = variants.reduce((sum, v) => sum + v.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Color Variants</Label>
        {variants.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Total Stock: {totalQuantity} units
          </span>
        )}
      </div>

      {/* Color Template */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-xs text-muted-foreground mb-2">Select from palette:</p>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_COLORS.map((color) => (
            <button
              key={color.hex}
              type="button"
              onClick={() => addColor(color.name, color.hex)}
              disabled={isColorSelected(color.hex)}
              className={`w-7 h-7 rounded-full border-2 transition-all relative
                ${isColorSelected(color.hex) 
                  ? 'border-primary ring-2 ring-primary/30' 
                  : 'border-border hover:border-primary/50 hover:scale-110'
                }
              `}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {isColorSelected(color.hex) && (
                <Check 
                  className={`w-3 h-3 absolute inset-0 m-auto ${
                    ['#FFFFFF', '#EAB308', '#D4A574'].includes(color.hex) 
                      ? 'text-gray-800' 
                      : 'text-white'
                  }`} 
                />
              )}
            </button>
          ))}
          
          {/* Custom color button */}
          <Popover open={showCustom} onOpenChange={setShowCustom}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-7 h-7 rounded-full border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-all"
                title="Add custom color"
              >
                <Plus className="w-3 h-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-3">
                <p className="text-sm font-medium">Custom Color</p>
                <div className="space-y-2">
                  <Input
                    placeholder="Color name (e.g., Sky Blue)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      className="w-10 h-10 rounded border-0 cursor-pointer"
                    />
                    <Input
                      placeholder="#000000"
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                <Button 
                  type="button" 
                  size="sm" 
                  className="w-full" 
                  onClick={addCustomColor}
                  disabled={!customName.trim()}
                >
                  Add Color
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Selected Variants with Quantity */}
      {variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Set quantity per color:</p>
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-card/50 border border-border/50"
            >
              <div
                className="w-6 h-6 rounded-full border border-border shrink-0"
                style={{ backgroundColor: variant.hex }}
              />
              <span className="text-sm font-medium flex-1">{variant.name}</span>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground sr-only">Qty</Label>
                <Input
                  type="number"
                  min="0"
                  value={variant.quantity}
                  onChange={(e) => updateQuantity(variant.id, parseInt(e.target.value) || 0)}
                  className="w-20 h-8 text-center"
                  placeholder="Qty"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeVariant(variant.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {variants.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Select colors above to add variants. Each variant can have its own quantity.
        </p>
      )}
    </div>
  );
};

export default ColorPicker;
