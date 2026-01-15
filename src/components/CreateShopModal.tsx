import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useShop } from '@/contexts/ShopContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CreateShopModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateShopModal = ({ open, onClose }: CreateShopModalProps) => {
  const { createShop } = useShop();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sameAsPersonal, setSameAsPersonal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    gst_number: '',
    address_line: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSameAsPersonal = (checked: boolean) => {
    setSameAsPersonal(checked);
    if (checked && profile) {
      setFormData(prev => ({
        ...prev,
        address_line: profile.address_line || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || 'India',
        postal_code: profile.postal_code || ''
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a shop name',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const { data, error } = await createShop(formData);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Shop created!',
        description: `${formData.name} has been created successfully.`
      });
      onClose();
      navigate('/dashboard');
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Create New Shop</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name *</Label>
              <Input
                id="shopName"
                placeholder="Enter shop name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="bg-card/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst">GST Number (Optional)</Label>
              <Input
                id="gst"
                placeholder="Enter GST number"
                value={formData.gst_number}
                onChange={(e) => handleChange('gst_number', e.target.value)}
                className="bg-card/50 border-border/50"
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-card/30 border border-border/30">
              <Checkbox 
                id="sameAddress" 
                checked={sameAsPersonal}
                onCheckedChange={handleSameAsPersonal}
              />
              <label htmlFor="sameAddress" className="text-sm cursor-pointer">
                Same as personal address
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine">Address Line</Label>
              <Input
                id="addressLine"
                placeholder="Street address"
                value={formData.address_line}
                onChange={(e) => handleChange('address_line', e.target.value)}
                disabled={sameAsPersonal}
                className="bg-card/50 border-border/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  disabled={sameAsPersonal}
                  className="bg-card/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  disabled={sameAsPersonal}
                  className="bg-card/50 border-border/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  disabled={sameAsPersonal}
                  className="bg-card/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="PIN Code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  disabled={sameAsPersonal}
                  className="bg-card/50 border-border/50"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="hero" onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Shop'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateShopModal;
