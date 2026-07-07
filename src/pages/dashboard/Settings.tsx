import { motion } from "framer-motion";
import { User, Store, Bell, Save, LogOut, Loader2, Palette, Moon, Sun, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useShop } from "@/contexts/ShopContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, Accent } from "@/hooks/useTheme";
import { useReviews } from "@/hooks/useReviews";
import { useIndiaStates, useIndiaCities, useIndiaPincodes } from "@/hooks/useIndiaLocations";
import BackButton from "@/components/BackButton";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { currentShop, updateShop, loading: shopLoading } = useShop();
  
  const [activeTab, setActiveTab] = useState("personal");
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const [personalData, setPersonalData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address_line: "",
    city: "",
    state: "",
    country: "",
    postal_code: ""
  });

  const [shopData, setShopData] = useState({
    name: "",
    gst_number: "",
    address_line: "",
    city: "",
    state: "",
    country: "",
    postal_code: ""
  });

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    bidAlerts: true,
    promotions: false,
    weeklyReport: true
  });

  // Load real data from profile when available
  useEffect(() => {
    if (profile) {
      setPersonalData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address_line: profile.address_line || "",
        city: profile.city || "",
        state: profile.state || "",
        country: profile.country || "",
        postal_code: profile.postal_code || ""
      });
    }
  }, [profile]);

  // Load real data from shop when available
  useEffect(() => {
    if (currentShop) {
      setShopData({
        name: currentShop.name || "",
        gst_number: currentShop.gst_number || "",
        address_line: currentShop.address_line || "",
        city: currentShop.city || "",
        state: currentShop.state || "",
        country: currentShop.country || "",
        postal_code: currentShop.postal_code || ""
      });
    }
  }, [currentShop]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save personal data
      const { error: profileError } = await updateProfile({
        full_name: personalData.full_name,
        phone: personalData.phone,
        address_line: personalData.address_line,
        city: personalData.city,
        state: personalData.state,
        country: personalData.country,
        postal_code: personalData.postal_code
      });

      if (profileError) throw profileError;

      // Save shop data if shop exists
      if (currentShop) {
        const { error: shopError } = await updateShop(currentShop.id, {
          name: shopData.name,
          gst_number: shopData.gst_number,
          address_line: shopData.address_line,
          city: shopData.city,
          state: shopData.state,
          country: shopData.country,
          postal_code: shopData.postal_code
        });

        if (shopError) throw shopError;
      }

      // Persist accent choice
      if (pendingAccent !== accent) commitAccent(pendingAccent);

      toast({
        title: "Settings saved!",
        description: "Your changes have been saved successfully.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  const { theme, setTheme, accent, previewAccent, commitAccent, restoreSavedAccent } = useTheme();
  const { stats: reviewStats } = useReviews();
  const [pendingAccent, setPendingAccent] = useState<Accent>(accent);
  useEffect(() => { setPendingAccent(accent); }, [accent]);
  // Revert live preview if the user leaves Settings without saving
  useEffect(() => () => { restoreSavedAccent(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const handlePickAccent = (a: Accent) => {
    setPendingAccent(a);
    previewAccent(a);
    setHasChanges(true);
  };
  const ACCENT_OPTIONS = [
    { id: 'sea', label: 'Sea Green', swatch: 'hsl(165 45% 40%)' },
    { id: 'brown', label: 'Warm Brown', swatch: 'hsl(32 65% 45%)' },
    { id: 'ocean', label: 'Ocean Blue', swatch: 'hsl(200 70% 45%)' },
    { id: 'sunset', label: 'Sunset', swatch: 'hsl(18 80% 55%)' },
    { id: 'forest', label: 'Forest', swatch: 'hsl(140 40% 35%)' },
    { id: 'plum', label: 'Plum', swatch: 'hsl(285 45% 45%)' },
  ] as const;

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "shop", label: "Shop Details", icon: Store },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const loading = profileLoading || shopLoading;

  // India location lookups
  const { states: indiaStates } = useIndiaStates();
  const { cities: personalCities } = useIndiaCities(personalData.state);
  const { pincodes: personalPins } = useIndiaPincodes(personalData.city);
  const { cities: shopCities } = useIndiaCities(shopData.state);
  const { pincodes: shopPins } = useIndiaPincodes(shopData.city);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-4 md:mb-8 flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-xl md:text-3xl font-bold mb-0.5">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 p-1 rounded-lg bg-card/50 border border-border/50 w-full sm:w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl bg-card/40 border border-border/50 p-4 sm:p-6 space-y-6"
      >
        {activeTab === "personal" && (
          <div className="space-y-4">
            {/* Overall rating */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall rating</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-primary">{reviewStats.average.toFixed(1)}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= Math.round(reviewStats.average) ? 'fill-primary text-primary' : 'text-muted-foreground/40'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">({reviewStats.total} review{reviewStats.total === 1 ? '' : 's'})</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/reviews')}>View reviews</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={personalData.full_name}
                  onChange={(e) => {
                    setPersonalData(prev => ({ ...prev, full_name: e.target.value }));
                    setHasChanges(true);
                  }}
                  placeholder="Enter your full name"
                  className="bg-card/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={personalData.email}
                  disabled
                  className="bg-card/50 border-border/50 opacity-50"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={personalData.phone}
                onChange={(e) => {
                  setPersonalData(prev => ({ ...prev, phone: e.target.value }));
                  setHasChanges(true);
                }}
                placeholder="Enter your phone number"
                className="bg-card/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line">Address Line</Label>
              <Input
                id="address_line"
                value={personalData.address_line}
                onChange={(e) => {
                  setPersonalData(prev => ({ ...prev, address_line: e.target.value }));
                  setHasChanges(true);
                }}
                placeholder="Enter your address"
                className="bg-card/50 border-border/50"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>State</Label>
                <Select
                  value={personalData.state || undefined}
                  onValueChange={(v) => {
                    setPersonalData(prev => ({ ...prev, state: v, city: "", postal_code: "", country: "India" }));
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="bg-card/50 border-border/50"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {indiaStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Select
                  value={personalData.city || undefined}
                  onValueChange={(v) => {
                    setPersonalData(prev => ({ ...prev, city: v, postal_code: "" }));
                    setHasChanges(true);
                  }}
                  disabled={!personalData.state}
                >
                  <SelectTrigger className="bg-card/50 border-border/50"><SelectValue placeholder={personalData.state ? "Select city" : "Select state first"} /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {personalCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={personalData.country || "India"} disabled className="bg-card/50 border-border/50 opacity-70" />
              </div>
              <div className="space-y-2">
                <Label>Postal Code</Label>
                {personalPins.length > 0 ? (
                  <Select
                    value={personalData.postal_code || undefined}
                    onValueChange={(v) => { setPersonalData(prev => ({ ...prev, postal_code: v })); setHasChanges(true); }}
                  >
                    <SelectTrigger className="bg-card/50 border-border/50"><SelectValue placeholder="Select pincode" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {personalPins.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={personalData.postal_code}
                    onChange={(e) => { setPersonalData(prev => ({ ...prev, postal_code: e.target.value })); setHasChanges(true); }}
                    placeholder={personalData.city ? "Enter postal code" : "Select city first"}
                    className="bg-card/50 border-border/50"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "shop" && (
          <div className="space-y-4">
            {!currentShop ? (
              <div className="p-8 rounded-xl bg-card/30 border border-border/30 text-center">
                <p className="text-muted-foreground">No shop selected. Please select or create a shop first.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input
                    id="shopName"
                    value={shopData.name}
                    onChange={(e) => {
                      setShopData(prev => ({ ...prev, name: e.target.value }));
                      setHasChanges(true);
                    }}
                    placeholder="Enter shop name"
                    className="bg-card/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst">GST Number</Label>
                  <Input
                    id="gst"
                    value={shopData.gst_number}
                    onChange={(e) => {
                      setShopData(prev => ({ ...prev, gst_number: e.target.value }));
                      setHasChanges(true);
                    }}
                    placeholder="Enter GST number"
                    className="bg-card/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopAddress">Shop Address Line</Label>
                  <Input
                    id="shopAddress"
                    value={shopData.address_line}
                    onChange={(e) => {
                      setShopData(prev => ({ ...prev, address_line: e.target.value }));
                      setHasChanges(true);
                    }}
                    placeholder="Enter shop address"
                    className="bg-card/50 border-border/50"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={shopData.state || undefined}
                      onValueChange={(v) => {
                        setShopData(prev => ({ ...prev, state: v, city: "", postal_code: "", country: "India" }));
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger className="bg-card/50 border-border/50"><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {indiaStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Select
                      value={shopData.city || undefined}
                      onValueChange={(v) => { setShopData(prev => ({ ...prev, city: v, postal_code: "" })); setHasChanges(true); }}
                      disabled={!shopData.state}
                    >
                      <SelectTrigger className="bg-card/50 border-border/50"><SelectValue placeholder={shopData.state ? "Select city" : "Select state first"} /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {shopCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopCountry">Country</Label>
                    <Input id="shopCountry" value={shopData.country || "India"} disabled className="bg-card/50 border-border/50 opacity-70" />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    {shopPins.length > 0 ? (
                      <Select
                        value={shopData.postal_code || undefined}
                        onValueChange={(v) => { setShopData(prev => ({ ...prev, postal_code: v })); setHasChanges(true); }}
                      >
                        <SelectTrigger className="bg-card/50 border-border/50"><SelectValue placeholder="Select pincode" /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {shopPins.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={shopData.postal_code}
                        onChange={(e) => { setShopData(prev => ({ ...prev, postal_code: e.target.value })); setHasChanges(true); }}
                        placeholder={shopData.city ? "Enter postal code" : "Select city first"}
                        className="bg-card/50 border-border/50"
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Theme</h3>
              <p className="text-sm text-muted-foreground mb-4">Choose how the dashboard looks on this device.</p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    theme === "light"
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-card/30 hover:border-border"
                  }`}
                >
                  <Sun className="w-5 h-5 mb-2 text-secondary" />
                  <p className="font-medium">Light</p>
                  <p className="text-xs text-muted-foreground">Bright, minimal</p>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    theme === "dark"
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-card/30 hover:border-border"
                  }`}
                >
                  <Moon className="w-5 h-5 mb-2 text-primary" />
                  <p className="font-medium">Dark</p>
                  <p className="text-xs text-muted-foreground">Premium, immersive</p>
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-1">Accent Color</h3>
              <p className="text-sm text-muted-foreground mb-4">Sea green is the default. Pick a palette that fits your brand.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ACCENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handlePickAccent(opt.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      pendingAccent === opt.id
                        ? "border-primary bg-primary/5"
                        : "border-border/50 bg-card/30 hover:border-border"
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-full border border-border/40 shrink-0"
                      style={{ background: opt.swatch }}
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Preview shown live — click <span className="font-medium">Save Changes</span> to apply this accent as the primary icon color.</p>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            {[
              { key: "orderUpdates", label: "Order Updates", desc: "Receive notifications for new orders and status changes" },
              { key: "bidAlerts", label: "Bid Alerts", desc: "Get notified when new bids are placed on your auctions" },
              { key: "promotions", label: "Promotions", desc: "Receive promotional offers and marketing updates" },
              { key: "weeklyReport", label: "Weekly Report", desc: "Get a weekly summary of your store performance" },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-xl bg-card/30 border border-border/30"
              >
                <div>
                  <h4 className="font-medium">{item.label}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(checked) => {
                    setNotifications(prev => ({ ...prev, [item.key]: checked }));
                    setHasChanges(true);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-8 mt-8 border-t border-border/50">
        <Button
          variant="outline"
          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
        <Button
          variant="hero"
          className="gap-2"
          disabled={!hasChanges || saving}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
