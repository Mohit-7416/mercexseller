import { useState } from 'react';
import { Plus, X, GripVertical, List, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Parameter, ParameterValue } from '@/hooks/useItems';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

interface ItemParametersProps {
  parameters: Parameter[];
  onChange: (parameters: Parameter[]) => void;
}

const ItemParameters = ({ parameters, onChange }: ItemParametersProps) => {
  const [newParamName, setNewParamName] = useState('');
  const [expandedParams, setExpandedParams] = useState<Set<string>>(new Set());
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});

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
      type: 'list',
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

    const valueText = newValueInputs[parameterId]?.trim();
    if (!valueText) return;

    // Check for duplicate
    if (param.values.some(v => v.value.toLowerCase() === valueText.toLowerCase())) {
      return;
    }

    const newValue: ParameterValue = {
      id: generateId(),
      value: valueText,
      isActive: true
    };

    setNewValueInputs(prev => ({ ...prev, [parameterId]: '' }));

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
                        <List className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{param.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {param.values.length} value{param.values.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Preview values */}
                    {param.values.length > 0 && !isExpanded && (
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          {param.values.slice(0, 3).map((v) => (
                            <span key={v.id} className="px-2 py-0.5 rounded bg-muted text-xs">
                              {v.value}
                            </span>
                          ))}
                        </div>
                        {param.values.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{param.values.length - 3}
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
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={newValueInputs[param.id] || ''}
                        onChange={(e) => setNewValueInputs(prev => ({ ...prev, [param.id]: e.target.value }))}
                        placeholder={`Add ${param.name.toLowerCase()} value`}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParameterValue(param.id))}
                        className="flex-1 min-w-0"
                      />
                      <Button
                        type="button"
                        onClick={() => addParameterValue(param.id)}
                        disabled={!newValueInputs[param.id]?.trim()}
                        className="shrink-0 w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Value
                      </Button>
                    </div>


                    {/* Values List */}
                    {param.values.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {param.values.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border/50"
                          >
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
            placeholder="Parameter name (e.g., Size, Color, Material)"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParameter())}
          />
          <Button
            type="button"
            onClick={addParameter}
            disabled={!newParamName.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Parameter
          </Button>
        </div>
      </div>

      {parameters.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <List className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No parameters defined</p>
          <p className="text-sm">Add parameters to enable variant management</p>
        </div>
      )}
    </div>
  );
};

export default ItemParameters;
