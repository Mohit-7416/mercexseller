import { useState } from 'react';
import { Plus, X, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Parameter, ParameterValue } from '@/hooks/useItems';

interface ParameterDefinitionProps {
  parameters: Parameter[];
  onChange: (parameters: Parameter[]) => void;
  includesColor: boolean;
  onColorToggle: (includes: boolean) => void;
}

// VIBGYOR spectrum for color selection
const VIBGYOR_COLORS = [
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Maroon', hex: '#7F1D1D' },
  { name: 'Beige', hex: '#D4A574' },
];

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

const ParameterDefinition = ({ 
  parameters, 
  onChange, 
  includesColor, 
  onColorToggle 
}: ParameterDefinitionProps) => {
  const [newParamName, setNewParamName] = useState('');
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Find color parameter if it exists
  const colorParameter = parameters.find(p => p.type === 'color');
  const regularParameters = parameters.filter(p => p.type !== 'color');

  const addParameter = () => {
    if (!newParamName.trim()) return;
    
    // Check for duplicate names
    if (parameters.some(p => p.name.toLowerCase() === newParamName.trim().toLowerCase())) {
      return;
    }

    const newParam: Parameter = {
      id: generateId(),
      name: newParamName.trim(),
      type: 'list',
      values: [],
      isActive: true,
      order: parameters.length
    };

    onChange([...parameters, newParam]);
    setNewParamName('');
  };

  const removeParameter = (id: string) => {
    onChange(parameters.filter(p => p.id !== id));
  };

  const addParameterValue = (parameterId: string) => {
    const value = newValueInputs[parameterId]?.trim();
    if (!value) return;

    const param = parameters.find(p => p.id === parameterId);
    if (!param) return;

    // Check for duplicate values
    if (param.values.some(v => v.value.toLowerCase() === value.toLowerCase())) {
      return;
    }

    const newValue: ParameterValue = {
      id: generateId(),
      value,
      isActive: true
    };

    onChange(parameters.map(p => 
      p.id === parameterId 
        ? { ...p, values: [...p.values, newValue] }
        : p
    ));

    setNewValueInputs(prev => ({ ...prev, [parameterId]: '' }));
  };

  const removeParameterValue = (parameterId: string, valueId: string) => {
    onChange(parameters.map(p => 
      p.id === parameterId 
        ? { ...p, values: p.values.filter(v => v.id !== valueId) }
        : p
    ));
  };

  const handleColorToggle = (checked: boolean) => {
    onColorToggle(checked);
    
    if (checked && !colorParameter) {
      // Add color parameter
      const newColorParam: Parameter = {
        id: generateId(),
        name: 'Color',
        type: 'color',
        values: [],
        isActive: true,
        order: parameters.length
      };
      onChange([...parameters, newColorParam]);
    } else if (!checked && colorParameter) {
      // Remove color parameter
      onChange(parameters.filter(p => p.type !== 'color'));
    }
  };

  const addColorValue = () => {
    if (!colorName.trim() || !colorParameter) return;

    // Check for duplicate colors
    if (colorParameter.values.some(v => 
      v.value.toLowerCase() === colorName.trim().toLowerCase() ||
      v.hex?.toLowerCase() === colorHex.toLowerCase()
    )) {
      return;
    }

    const newValue: ParameterValue = {
      id: generateId(),
      value: colorName.trim(),
      hex: colorHex,
      isActive: true
    };

    onChange(parameters.map(p => 
      p.type === 'color' 
        ? { ...p, values: [...p.values, newValue] }
        : p
    ));

    setColorName('');
    setColorHex('#000000');
    setShowColorPicker(false);
  };

  const selectPredefinedColor = (name: string, hex: string) => {
    setColorName(name);
    setColorHex(hex);
  };

  return (
    <div className="space-y-6">
      {/* Color Toggle */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Does this item include color variations?</Label>
            <p className="text-xs text-muted-foreground">
              Enable to add color as a variant parameter
            </p>
          </div>
          <Switch
            checked={includesColor}
            onCheckedChange={handleColorToggle}
          />
        </div>

        {/* Color Parameter Values */}
        {includesColor && colorParameter && (
          <div className="space-y-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <span className="font-medium">Color Values</span>
            </div>

            {/* VIBGYOR Spectrum */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quick select from palette:</p>
              <div className="flex flex-wrap gap-2">
                {VIBGYOR_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => selectPredefinedColor(color.name, color.hex)}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110
                      ${colorHex === color.hex ? 'border-primary ring-2 ring-primary/30' : 'border-border'}
                    `}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Color Input */}
            <div className="flex gap-2">
              <Input
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="Color name (e.g., Sky Blue)"
                className="flex-1"
              />
              <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-lg border border-border shrink-0"
                    style={{ backgroundColor: colorHex }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                  <div className="space-y-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-full h-32 cursor-pointer rounded"
                    />
                    <Input
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      placeholder="#000000"
                      className="font-mono"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="secondary"
                onClick={addColorValue}
                disabled={!colorName.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Color Values List */}
            {colorParameter.values.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {colorParameter.values.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-full bg-card border border-border/50"
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-border/50"
                      style={{ backgroundColor: v.hex }}
                    />
                    <span className="text-sm">{v.value}</span>
                    <button
                      type="button"
                      onClick={() => removeParameterValue(colorParameter.id, v.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Parameters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Item Parameters</Label>
          <span className="text-xs text-muted-foreground">
            Define custom attributes for variants
          </span>
        </div>

        {/* Existing Parameters */}
        {regularParameters.map((param) => (
          <div
            key={param.id}
            className="p-4 rounded-lg border border-border/50 bg-card/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{param.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeParameter(param.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Add Value Input */}
            <div className="flex gap-2">
              <Input
                value={newValueInputs[param.id] || ''}
                onChange={(e) => setNewValueInputs(prev => ({ ...prev, [param.id]: e.target.value }))}
                placeholder={`Add ${param.name.toLowerCase()} value`}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParameterValue(param.id))}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => addParameterValue(param.id)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Values */}
            {param.values.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {param.values.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-sm"
                  >
                    <span>{v.value}</span>
                    <button
                      type="button"
                      onClick={() => removeParameterValue(param.id, v.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No values added yet</p>
            )}
          </div>
        ))}

        {/* Add New Parameter */}
        <div className="flex gap-2">
          <Input
            value={newParamName}
            onChange={(e) => setNewParamName(e.target.value)}
            placeholder="Parameter name (e.g., Size, Material, Style)"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParameter())}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addParameter}
            disabled={!newParamName.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Define parameters like Size, Material, etc. Each parameter can have multiple values.
        </p>
      </div>
    </div>
  );
};

export default ParameterDefinition;
