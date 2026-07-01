import { motion } from "framer-motion";
import { User, Store, Bell, Save, LogOut, Loader2, Palette, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useShop } from "@/contexts/ShopContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
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

  const { theme, setTheme } = useTheme();

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "shop", label: "Shop Details", icon: Store },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const loading = profileLoading || shopLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <BackButton />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
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
        className="space-y-6"
      >
        {activeTab === "personal" && (
          <div className="space-y-4">
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
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={personalData.city}
                  onChange={(e) => {
                    setPersonalData(prev => ({ ...prev, city: e.target.value }));
                    setHasChanges(true);
                  }}
                  placeholder="Enter your city"
                  className="bg-card/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={personalData.state}
                  onChange={(e) => {
                    setPersonalData(prev => ({ ...prev, state: e.target.value }));
                    setHasChanges(true);
                  }}
                  placeholder="Enter your state"
                  className="bg-card/50 border-border/50"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={personalData.country}
                  onChange={(e) => {
                    setPersonalData(prev => ({ ...prev, country: e.target.value }));
                    setHasChanges(true);
                  }}
                  placeholder="Enter your country"
                  className="bg-card/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={personalData.postal_code}
                  onChange={(e) => {
                    setPersonalData(prev => ({ ...prev, postal_code: e.target.value }));
                    setHasChanges(true);
                  }}
                  placeholder="Enter your postal code"
                  className="bg-card/50 border-border/50"
                />
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
                    <Label htmlFor="shopCity">City</Label>
                    <Input
                      id="shopCity"
                      value={shopData.city}
                      onChange={(e) => {
                        setShopData(prev => ({ ...prev, city: e.target.value }));
                        setHasChanges(true);
                      }}
                      placeholder="Enter city"
                      className="bg-card/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopState">State</Label>
                    <Input
                      id="shopState"
                      value={shopData.state}
                      onChange={(e) => {
                        setShopData(prev => ({ ...prev, state: e.target.value }));
                        setHasChanges(true);
                      }}
                      placeholder="Enter state"
                      className="bg-card/50 border-border/50"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopCountry">Country</Label>
                    <Input
                      id="shopCountry"
                      value={shopData.country}
                      onChange={(e) => {
                        setShopData(prev => ({ ...prev, country: e.target.value }));
                        setHasChanges(true);
                      }}
                      placeholder="Enter country"
                      className="bg-card/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopPostalCode">Postal Code</Label>
                    <Input
                      id="shopPostalCode"
                      value={shopData.postal_code}
                      onChange={(e) => {
                        setShopData(prev => ({ ...prev, postal_code: e.target.value }));
                        setHasChanges(true);
                      }}
                      placeholder="Enter postal code"
                      className="bg-card/50 border-border/50"
                    />
                  </div>
                </div>
              </>
            )}
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
