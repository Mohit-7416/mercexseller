import { motion } from "framer-motion";
import { User, Store, Bell, Shield, Save, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [hasChanges, setHasChanges] = useState(false);

  const [personalData, setPersonalData] = useState({
    fullName: "John Sharma",
    email: "john@example.com",
    phone: "+91 98765 43210",
    address: "123 Market Street, Mumbai"
  });

  const [shopData, setShopData] = useState({
    shopName: "John's Antique Store",
    gst: "27AABCU9603R1ZM",
    shopAddress: "Shop 45, Crawford Market, Mumbai"
  });

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    bidAlerts: true,
    promotions: false,
    weeklyReport: true
  });

  const handleSave = () => {
    toast({
      title: "Settings saved!",
      description: "Your changes have been saved successfully.",
    });
    setHasChanges(false);
  };

  const handleSignOut = () => {
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "shop", label: "Shop Details", icon: Store },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1 rounded-lg bg-card/50 border border-border/50 w-fit">
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
                  value={personalData.fullName}
                  onChange={(e) => {
                    setPersonalData(prev => ({ ...prev, fullName: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="bg-card/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={personalData.email}
                  onChange={(e) => {
                    setPersonalData(prev => ({ ...prev, email: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="bg-card/50 border-border/50"
                />
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
                className="bg-card/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={personalData.address}
                onChange={(e) => {
                  setPersonalData(prev => ({ ...prev, address: e.target.value }));
                  setHasChanges(true);
                }}
                className="bg-card/50 border-border/50"
              />
            </div>
          </div>
        )}

        {activeTab === "shop" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={shopData.shopName}
                onChange={(e) => {
                  setShopData(prev => ({ ...prev, shopName: e.target.value }));
                  setHasChanges(true);
                }}
                className="bg-card/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst">GST Number</Label>
              <Input
                id="gst"
                value={shopData.gst}
                onChange={(e) => {
                  setShopData(prev => ({ ...prev, gst: e.target.value }));
                  setHasChanges(true);
                }}
                className="bg-card/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopAddress">Shop Address</Label>
              <Input
                id="shopAddress"
                value={shopData.shopAddress}
                onChange={(e) => {
                  setShopData(prev => ({ ...prev, shopAddress: e.target.value }));
                  setHasChanges(true);
                }}
                className="bg-card/50 border-border/50"
              />
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
          disabled={!hasChanges}
          onClick={handleSave}
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default Settings;
