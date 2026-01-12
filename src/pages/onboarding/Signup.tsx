import { motion } from "framer-motion";
import { ArrowLeft, User, Store, Lock, Copy, Check, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const generateSecurityCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i < 11) code += '-';
  }
  return code;
};

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [sameAddress, setSameAddress] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [securityCode] = useState(generateSecurityCode());
  const [copied, setCopied] = useState(false);
  const [showSecurityCode, setShowSecurityCode] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    age: '',
    aadhaar: '',
    personalAddress: '',
    shopName: '',
    gst: '',
    shopAddress: '',
    email: '',
    password: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'personalAddress' && sameAddress ? { shopAddress: value } : {})
    }));
  };

  const handleSameAddress = (checked: boolean) => {
    setSameAddress(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, shopAddress: prev.personalAddress }));
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(securityCode);
    setCopied(true);
    toast({
      title: "Security code copied!",
      description: "Store it somewhere safe. You'll need it for your first login.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignup = () => {
    if (!showSecurityCode) {
      setShowSecurityCode(true);
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/onboarding/terms")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">Step 3 of 3</span>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { num: 1, label: "Personal Info", icon: User },
            { num: 2, label: "Shop Details", icon: Store },
            { num: 3, label: "Credentials", icon: Lock }
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
              {i < 2 && <div className="w-8 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
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
                    className="flex h-10 w-full rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                <Label htmlFor="aadhaar">Aadhaar Number</Label>
                <Input
                  id="aadhaar"
                  placeholder="XXXX XXXX XXXX"
                  value={formData.aadhaar}
                  onChange={(e) => handleChange('aadhaar', e.target.value)}
                  className="bg-card/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalAddress">Residential Address</Label>
                <Input
                  id="personalAddress"
                  placeholder="Enter your address"
                  value={formData.personalAddress}
                  onChange={(e) => handleChange('personalAddress', e.target.value)}
                  className="bg-card/50 border-border/50"
                />
              </div>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full mt-6"
              onClick={() => setStep(2)}
            >
              Continue to Shop Details
            </Button>
          </motion.div>
        )}

        {/* Step 2: Shop Information */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Shop Information</h2>
              <p className="text-muted-foreground">Tell us about your business</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  placeholder="Enter your shop name"
                  value={formData.shopName}
                  onChange={(e) => handleChange('shopName', e.target.value)}
                  className="bg-card/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst">GST Number (Optional)</Label>
                <Input
                  id="gst"
                  placeholder="Enter GST number if available"
                  value={formData.gst}
                  onChange={(e) => handleChange('gst', e.target.value)}
                  className="bg-card/50 border-border/50"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-card/30 border border-border/30">
                <Checkbox 
                  id="sameAddress" 
                  checked={sameAddress}
                  onCheckedChange={handleSameAddress}
                />
                <label htmlFor="sameAddress" className="text-sm cursor-pointer">
                  Same as personal address
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopAddress">Shop Address</Label>
                <Input
                  id="shopAddress"
                  placeholder="Enter your shop address"
                  value={formData.shopAddress}
                  onChange={(e) => handleChange('shopAddress', e.target.value)}
                  disabled={sameAddress}
                  className="bg-card/50 border-border/50 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button variant="hero" onClick={() => setStep(3)} className="flex-1">
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Credentials */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
              <p className="text-muted-foreground">Set up your login credentials</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="bg-card/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="bg-card/50 border-border/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Security Code */}
            {showSecurityCode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-primary/5 border border-primary/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Your Security Code</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This code is shown only once. Save it securely — you'll need it for your first login.
                </p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 px-4 py-3 rounded-lg bg-card font-mono text-lg tracking-wider text-center">
                    {securityCode}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyCode}
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </motion.div>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button variant="hero" onClick={handleSignup} className="flex-1">
                {showSecurityCode ? 'Go to Dashboard' : 'Create Account'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Signup;
