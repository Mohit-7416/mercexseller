import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight, Check, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Item, Parameter, ParameterValue, VariantDetail } from '@/hooks/useItems';
import { Category, Subcategory } from '@/hooks/useCategories';
import ItemBasicInfo from './wizard/ItemBasicInfo';
import ItemParameters from './wizard/ItemParameters';
import ItemVariantConfig from './wizard/ItemVariantConfig';
import ItemReview from './wizard/ItemReview';

export interface ImageItem {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

export interface WizardFormData {
  // Basic Info
  name: string;
  description: string;
  category_id: string;
  subcategory_id: string;
  custom_category: string;
  custom_subcategory: string;
  price: string;
  cost_price: string;
  unitOfMeasure: string;
  isActive: boolean;
  // Listing type (sale = has quantity; auction = single unit)
  listingType: 'sale' | 'auction';
  // Parameters
  parameters: Parameter[];
  // Variant Config
  hasVariants: boolean;
  variants: VariantDetail[];
  // For single SKU (no variants)
  singleQuantity: number;
  singleSoldQuantity: number;
  singleNotes: string;
  singleImages: ImageItem[];
}

const STEPS = [
  { id: 'basic', title: 'Basic Info', description: 'Item details' },
  { id: 'parameters', title: 'Parameters', description: 'Define attributes' },
  { id: 'variants', title: 'Variants & Images', description: 'Configure inventory' },
  { id: 'review', title: 'Review', description: 'Confirm and save' },
];

const OTHERS_ID = 'others';

interface ItemWizardProps {
  open: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<Item>) => Promise<void>;
  item: Item | null;
  categories: Category[];
  getSubcategoriesByCategory: (categoryId: string) => Subcategory[];
  shopId: string;
  saving: boolean;
  listingType?: 'sale' | 'auction';
}

const ItemWizard = ({
  open,
  onClose,
  onSave,
  item,
  categories,
  getSubcategoriesByCategory,
  shopId,
  saving,
  listingType = 'sale',
}: ItemWizardProps) => {
  const isAuction = listingType === 'auction';
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>({
    name: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    custom_category: '',
    custom_subcategory: '',
    price: '',
    cost_price: '',
    unitOfMeasure: 'pieces',
    isActive: true,
    parameters: [],
    hasVariants: false,
    variants: [],
    singleQuantity: 0,
    singleSoldQuantity: 0,
    singleNotes: '',
    singleImages: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when editing
  useEffect(() => {
    if (item) {
      const savedData = item.dimensions || {};
      
      const existingParameters: Parameter[] = (savedData.parameters || []).map((p: any, idx: number) => ({
        ...p,
        type: p.type === 'color' ? 'list' : (p.type || 'list'), // Convert color to list
        isActive: p.isActive ?? true,
        order: p.order ?? idx,
        values: (p.values || []).map((v: any) => ({
          ...v,
          isActive: v.isActive ?? true
        }))
      }));

      const existingVariants: VariantDetail[] = (savedData.variants || []).map((v: any) => ({
        ...v,
        reservedQuantity: v.reservedQuantity ?? 0,
        soldQuantity: v.soldQuantity ?? 0,
        isActive: v.isActive ?? true,
        images: v.images || []
      }));

      setFormData({
        name: item.name,
        description: item.description || '',
        category_id: savedData.custom_category ? OTHERS_ID : (item.category_id || ''),
        subcategory_id: savedData.custom_subcategory ? OTHERS_ID : (item.subcategory_id || ''),
        custom_category: savedData.custom_category || '',
        custom_subcategory: savedData.custom_subcategory || '',
        price: item.price.toString(),
        cost_price: item.cost_price?.toString() || '',
        unitOfMeasure: savedData.unitOfMeasure || 'pieces',
        isActive: item.is_active,
        parameters: existingParameters,
        hasVariants: existingVariants.length > 0,
        variants: existingVariants,
        singleQuantity: existingVariants.length === 0 ? item.quantity : 0,
        singleSoldQuantity: savedData.singleSoldQuantity || 0,
        singleNotes: savedData.singleNotes || '',
        singleImages: savedData.singleImages || [],
      });
    } else {
      // Reset for new item
      setFormData({
        name: '',
        description: '',
        category_id: '',
        subcategory_id: '',
        custom_category: '',
        custom_subcategory: '',
        price: '',
        cost_price: '',
        unitOfMeasure: 'pieces',
        isActive: true,
        parameters: [],
        hasVariants: false,
        variants: [],
        singleQuantity: 0,
        singleSoldQuantity: 0,
        singleNotes: '',
        singleImages: [],
      });
      setCurrentStep(0);
    }
    setErrors({});
  }, [item, open]);

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.name.trim()) {
          newErrors.name = 'Name is required';
        }
        if (!formData.price || parseFloat(formData.price) < 0) {
          newErrors.price = 'Valid price is required';
        }
        if (formData.category_id === OTHERS_ID && !formData.custom_category.trim()) {
          newErrors.custom_category = 'Please enter custom category name';
        }
        if (formData.subcategory_id === OTHERS_ID && !formData.custom_subcategory.trim()) {
          newErrors.custom_subcategory = 'Please enter custom subcategory name';
        }
        break;

      case 1: // Parameters
        // Parameters are optional, no validation needed
        break;

      case 2: // Variants
        if (formData.hasVariants) {
          if (formData.variants.length === 0) {
            newErrors.variants = 'At least one variant is required';
          }
          const missingQty = formData.variants.filter(v => v.quantity < 0);
          if (missingQty.length > 0) {
            newErrors.variants = 'Quantity cannot be negative';
          }
          // Check for duplicate combinations
          const seen = new Set<string>();
          const activeParams = formData.parameters.filter(p => p.isActive && p.values.length > 0);
          for (const variant of formData.variants) {
            const key = activeParams
              .map(p => variant.parameterValues[p.id] || '')
              .join('|');
            if (seen.has(key)) {
              newErrors.variants = 'Duplicate variant combination detected';
              break;
            }
            seen.add(key);
          }
        } else {
          if (formData.singleQuantity < 0) {
            newErrors.singleQuantity = 'Quantity cannot be negative';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;

    // Auction items are always a single unit with no variants
    const effectiveHasVariants = isAuction ? false : formData.hasVariants;
    const effectiveSingleQty = isAuction ? 1 : formData.singleQuantity;

    // Calculate total quantity
    const totalQuantity = effectiveHasVariants
      ? formData.variants.reduce((sum, v) => sum + v.quantity, 0)
      : effectiveSingleQty;

    // Collect all images from variants or single SKU
    const allImageUrls: string[] = [];
    if (effectiveHasVariants) {
      formData.variants.forEach(v => {
        const variantImages = v.images || [];
        variantImages.forEach(img => {
          if (!allImageUrls.includes(img.url)) {
            allImageUrls.push(img.url);
          }
        });
      });
    } else {
      // Collect single SKU images
      formData.singleImages.forEach(img => {
        if (!allImageUrls.includes(img.url)) {
          allImageUrls.push(img.url);
        }
      });
    }

    const itemData: Partial<Item> = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      category_id: formData.category_id === OTHERS_ID ? null : formData.category_id || null,
      subcategory_id: formData.subcategory_id === OTHERS_ID ? null : formData.subcategory_id || null,
      quantity: totalQuantity,
      price: parseFloat(formData.price) || 0,
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      sku: null, // SKU removed
      is_active: formData.isActive,
      images: allImageUrls,
      variants: null,
      dimensions: {
        listing_type: listingType,
        custom_category: formData.category_id === OTHERS_ID ? formData.custom_category.trim() : null,
        custom_subcategory: formData.subcategory_id === OTHERS_ID ? formData.custom_subcategory.trim() : null,
        unitOfMeasure: formData.unitOfMeasure,
        parameters: formData.parameters,
        variants: effectiveHasVariants ? formData.variants : [],
        hasVariants: effectiveHasVariants,
        singleQuantity: effectiveHasVariants ? 0 : effectiveSingleQty,
        singleSoldQuantity: effectiveHasVariants ? 0 : formData.singleSoldQuantity,
        singleNotes: effectiveHasVariants ? '' : formData.singleNotes,
        singleImages: effectiveHasVariants ? [] : formData.singleImages,
      }
    };

    await onSave(itemData);
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ItemBasicInfo
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            categories={categories}
            getSubcategoriesByCategory={getSubcategoriesByCategory}
            shopId={shopId}
          />
        );
      case 1:
        return (
          <ItemParameters
            parameters={formData.parameters}
            onChange={(parameters) => updateFormData({ parameters })}
          />
        );
      case 2:
        return (
          <ItemVariantConfig
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            shopId={shopId}
          />
        );
      case 3:
        return (
          <ItemReview
            formData={formData}
            categories={categories}
            getSubcategoriesByCategory={getSubcategoriesByCategory}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[calc(100%-1rem)] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <Package className="w-5 h-5" />
            {item ? 'Edit Item' : 'Create New Item'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="shrink-0 space-y-4 pb-4">
          <Progress value={progress} className="h-1" />
          
          {/* Step indicators */}
          <div className="flex justify-between">
            {STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => idx < currentStep && setCurrentStep(idx)}
                disabled={idx > currentStep}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  idx === currentStep
                    ? 'text-primary font-medium'
                    : idx < currentStep
                    ? 'text-muted-foreground hover:text-foreground cursor-pointer'
                    : 'text-muted-foreground/50 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : idx === currentStep
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <div className="hidden md:block">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin pr-1 sm:pr-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="py-4"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 pt-4 border-t">
          {currentStep > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={saving}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          
          <div className="flex-1" />
          
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button variant="hero" size="sm" onClick={handleNext} className="gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="hero" size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {item ? 'Update Item' : 'Create Item'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemWizard;
