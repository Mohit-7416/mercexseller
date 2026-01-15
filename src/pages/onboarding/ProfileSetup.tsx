import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    age: '',
    aadhaar_number: '',
    address_line: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    phone: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        gender: profile.gender || '',
        age: profile.age?.toString() || '',
        aadhaar_number: profile.aadhaar_number || '',
        address_line: profile.address_line || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || 'India',
        postal_code: profile.postal_code || '',
        phone: profile.phone || ''
      });
    }
  }, [user, profile, navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.full_name.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter your full name',
          variant: 'destructive'
        });
        return;
      }
      setStep(2);
    } else {
      setLoading(true);
      const { error } = await updateProfile({
        full_name: formData.full_name,
        gender: formData.gender || null,
        age: formData.age ? parseInt(formData.age) : null,
        aadhaar_number: formData.aadhaar_number || null,
        address_line: formData.address_line || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || 'India',
        postal_code: formData.postal_code || null,
        phone: formData.phone || null
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Profile saved!',
          description: 'Your profile has been updated successfully.'
        });
        navigate('/shops');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => step === 1 ? navigate('/auth') : setStep(1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">Step {step} of 2</span>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { num: 1, label: "Personal Info", icon: User },
            { num: 2, label: "Address", icon: MapPin }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * i }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  step === s.num 
                    ? 'bg-primary text-primary-foreground' 
                    : step > s.num 
                    ? 'bg-primary/20 text-primary'
                    : 'bg-card text-muted-foreground'
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </motion.div>
              {i < 1 && <div className="w-8 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  className="bg-card/50 border-border/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Age"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className="bg-card/50 border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="bg-card/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaar">Aadhaar Number (Optional)</Label>
                <Input
                  id="aadhaar"
                  placeholder="XXXX XXXX XXXX"
                  value={formData.aadhaar_number}
                  onChange={(e) => handleChange('aadhaar_number', e.target.value)}
                  className="bg-card/50 border-border/50"
                />
              </div>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full mt-6 gap-2"
              onClick={handleNext}
            >
              Continue to Address
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Your Address</h2>
              <p className="text-muted-foreground">This will be used for communication and shipping</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressLine">Address Line</Label>
                <Input
                  id="addressLine"
                  placeholder="Street address, apartment, etc."
                  value={formData.address_line}
                  onChange={(e) => handleChange('address_line', e.target.value)}
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
                    className="bg-card/50 border-border/50"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full mt-6"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfileSetup;
