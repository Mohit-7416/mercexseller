import { useState } from 'react';
import { Plus, X, GripVertical, Palette, List, Type, Hash, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Parameter, ParameterValue } from '../ItemWizard';

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

const PARAM_TYPES = [
  { value: 'list', label: 'List (predefined values)', icon: List },
  { value: 'color', label: 'Color (with palette)', icon: Palette },
  { value: 'text', label: 'Text (free input)', icon: Type },
  { value: 'numeric', label: 'Numeric (numbers only)', icon: Hash },
];

interface ItemParametersProps {
  parameters: Parameter[];
  onChange: (parameters: Parameter[]) => void;
}

const ItemParameters = ({ parameters, onChange }: ItemParametersProps) => {
  const [newParamName, setNewParamName] = useState('');
  const [newParamType, setNewParamType] = useState<Parameter['type']>('list');
  const [expandedParams, setExpandedParams] = useState<Set<string>>(new Set());
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});
  const [colorInputs, setColorInputs] = useState<Record<string, { name: string; hex: string }>>({});

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedParams);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedParams(newExpanded);
  };

  const addParameter = () => {
    if (!newParamName.trim()) return;

    // Check for duplicate names
    if (parameters.some(p => p.name.toLowerCase() === newParamName.trim().toLowerCase())) {
      return;
    }

    const newParam: Parameter = {
      id: generateId(),
      name: newParamName.trim(),
      type: newParamType,
      values: [],
      isActive: true,
      order: parameters.length
    };

    onChange([...parameters, newParam]);
    setNewParamName('');
    setExpandedParams(prev => new Set([...prev, newParam.id]));
  };

  const removeParameter = (id: string) => {
    onChange(parameters.filter(p => p.id !== id));
  };

  const moveParameter = (id: string, direction: 'up' | 'down') => {
    const index = parameters.findIndex(p => p.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= parameters.length) return;

    const newParams = [...parameters];
    [newParams[index], newParams[newIndex]] = [newParams[newIndex], newParams[index]];
    
    // Update order values
    newParams.forEach((p, idx) => {
      p.order = idx;
    });

    onChange(newParams);
  };

  const addParameterValue = (parameterId: string) => {
    const param = parameters.find(p => p.id === parameterId);
    if (!param) return;

    let newValue: ParameterValue;

    if (param.type === 'color') {
      const colorInput = colorInputs[parameterId] || { name: '', hex: '#000000' };
      if (!colorInput.name.trim()) return;

      // Check for duplicate
      if (param.values.some(v => 
        v.value.toLowerCase() === colorInput.name.trim().toLowerCase() ||
        v.hex?.toLowerCase() === colorInput.hex.toLowerCase()
      )) return;

      newValue = {
        id: generateId(),
        value: colorInput.name.trim(),
        hex: colorInput.hex,
        isActive: true
      };

      setColorInputs(prev => ({ ...prev, [parameterId]: { name: '', hex: '#000000' } }));
    } else {
      const valueText = newValueInputs[parameterId]?.trim();
      if (!valueText) return;

      // Check for duplicate
      if (param.values.some(v => v.value.toLowerCase() === valueText.toLowerCase())) {
        return;
      }

      newValue = {
        id: generateId(),
        value: valueText,
        isActive: true
      };

      setNewValueInputs(prev => ({ ...prev, [parameterId]: '' }));
    }

    onChange(parameters.map(p =>
      p.id === parameterId
        ? { ...p, values: [...p.values, newValue] }
        : p
    ));
  };

  const removeParameterValue = (parameterId: string, valueId: string) => {
    onChange(parameters.map(p =>
      p.id === parameterId
        ? { ...p, values: p.values.filter(v => v.id !== valueId) }
        : p
    ));
  };

  const getTypeIcon = (type: Parameter['type']) => {
    const typeConfig = PARAM_TYPES.find(t => t.value === type);
    return typeConfig?.icon || List;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Product Parameters</h3>
        <p className="text-sm text-muted-foreground">
          Define custom attributes like Size, Color, Material, etc. Each parameter can have multiple values.
        </p>
      </div>

      {/* Existing Parameters */}
      <div className="space-y-3">
        {parameters.map((param, index) => {
          const TypeIcon = getTypeIcon(param.type);
          const isExpanded = expandedParams.has(param.id);

          return (
            <Collapsible
              key={param.id}
              open={isExpanded}
              onOpenChange={() => toggleExpanded(param.id)}
            >
              <div className="border border-border/50 rounded-lg overflow-hidden bg-card/50">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TypeIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{param.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {param.values.length} value{param.values.length !== 1 ? 's' : ''} • {PARAM_TYPES.find(t => t.value === param.type)?.label}
                        </p>
                      </div>
                    </div>

                    {/* Preview values */}
                    {param.values.length > 0 && !isExpanded && (
                      <div className="flex items-center gap-1">
                        {param.type === 'color' ? (
                          <div className="flex -space-x-1">
                            {param.values.slice(0, 5).map((v) => (
                              <div
                                key={v.id}
                                className="w-5 h-5 rounded-full border-2 border-background"
                                style={{ backgroundColor: v.hex }}
                                title={v.value}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            {param.values.slice(0, 3).map((v) => (
                              <span key={v.id} className="px-2 py-0.5 rounded bg-muted text-xs">
                                {v.value}
                              </span>
                            ))}
                          </div>
                        )}
                        {param.values.length > (param.type === 'color' ? 5 : 3) && (
                          <span className="text-xs text-muted-foreground">
                            +{param.values.length - (param.type === 'color' ? 5 : 3)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); moveParameter(param.id, 'up'); }}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); moveParameter(param.id, 'down'); }}
                        disabled={index === parameters.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); removeParameter(param.id); }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-4 pt-0 border-t border-border/50 space-y-4">
                    {/* Add Value Input */}
                    {param.type === 'color' ? (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">Quick select from palette:</p>
                        <div className="flex flex-wrap gap-2">
                          {VIBGYOR_COLORS.map((color) => (
                            <button
                              key={color.hex}
                              type="button"
                              onClick={() => setColorInputs(prev => ({
                                ...prev,
                                [param.id]: { name: color.name, hex: color.hex }
                              }))}
                              className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110
                                ${colorInputs[param.id]?.hex === color.hex ? 'border-primary ring-2 ring-primary/30' : 'border-border'}
                              `}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            value={colorInputs[param.id]?.name || ''}
                            onChange={(e) => setColorInputs(prev => ({
                              ...prev,
                              [param.id]: { ...prev[param.id], name: e.target.value, hex: prev[param.id]?.hex || '#000000' }
                            }))}
                            placeholder="Color name (e.g., Sky Blue)"
                            className="flex-1"
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="w-10 h-10 rounded-lg border border-border shrink-0"
                                style={{ backgroundColor: colorInputs[param.id]?.hex || '#000000' }}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3" align="end">
                              <div className="space-y-2">
                                <input
                                  type="color"
                                  value={colorInputs[param.id]?.hex || '#000000'}
                                  onChange={(e) => setColorInputs(prev => ({
                                    ...prev,
                                    [param.id]: { ...prev[param.id], name: prev[param.id]?.name || '', hex: e.target.value }
                                  }))}
                                  className="w-full h-32 cursor-pointer rounded"
                                />
                                <Input
                                  value={colorInputs[param.id]?.hex || '#000000'}
                                  onChange={(e) => setColorInputs(prev => ({
                                    ...prev,
                                    [param.id]: { ...prev[param.id], name: prev[param.id]?.name || '', hex: e.target.value }
                                  }))}
                                  placeholder="#000000"
                                  className="font-mono"
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            type="button"
                            onClick={() => addParameterValue(param.id)}
                            disabled={!colorInputs[param.id]?.name?.trim()}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={newValueInputs[param.id] || ''}
                          onChange={(e) => setNewValueInputs(prev => ({ ...prev, [param.id]: e.target.value }))}
                          placeholder={`Add ${param.name.toLowerCase()} value`}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParameterValue(param.id))}
                          type={param.type === 'numeric' ? 'number' : 'text'}
                        />
                        <Button
                          type="button"
                          onClick={() => addParameterValue(param.id)}
                          disabled={!newValueInputs[param.id]?.trim()}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    )}

                    {/* Values List */}
                    {param.values.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {param.values.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border/50"
                          >
                            {v.hex && (
                              <div
                                className="w-4 h-4 rounded-full border border-border/50"
                                style={{ backgroundColor: v.hex }}
                              />
                            )}
                            <span className="text-sm">{v.value}</span>
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
                      <p className="text-sm text-muted-foreground">No values added yet</p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Add New Parameter */}
      <div className="p-4 rounded-lg border-2 border-dashed border-border/50 space-y-4">
        <Label className="text-sm font-medium">Add New Parameter</Label>
        <div className="flex gap-2">
          <Input
            value={newParamName}
            onChange={(e) => setNewParamName(e.target.value)}
            placeholder="Parameter name (e.g., Size, Material)"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParameter())}
          />
          <Select
            value={newParamType}
            onValueChange={(v: Parameter['type']) => setNewParamType(v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARAM_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    <span>{type.label.split(' ')[0]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={addParameter}
            disabled={!newParamName.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {parameters.length === 0 && (
        <div className="p-6 rounded-lg bg-muted/30 text-center">
          <p className="text-muted-foreground">
            No parameters defined yet. Parameters are optional but help organize variants.
          </p>
        </div>
      )}
    </div>
  );
};

export default ItemParameters;
