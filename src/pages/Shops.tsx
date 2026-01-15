import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Store, Plus, ChevronRight, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useShop, Shop } from '@/contexts/ShopContext';
import { useToast } from '@/hooks/use-toast';
import CreateShopModal from '@/components/CreateShopModal';

const Shops = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { shops, loading, setCurrentShop } = useShop();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSelectShop = (shop: Shop) => {
    setCurrentShop(shop);
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.'
    });
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-sea-green-dark flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-bold text-lg">SellerHub</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/account')}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-2">Your Shops</h2>
          <p className="text-muted-foreground">
            Select a shop to access its dashboard, or create a new one.
          </p>
        </motion.div>

        {/* Shops Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {shops.map((shop, index) => (
            <motion.button
              key={shop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={() => handleSelectShop(shop)}
              className="p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all duration-300 text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-7 h-7 text-primary" />
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-1">{shop.name}</h3>
              {shop.city && shop.state && (
                <p className="text-sm text-muted-foreground mb-3">
                  {shop.city}, {shop.state}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  shop.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {shop.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </motion.button>
          ))}

          {/* Create New Shop Card */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * shops.length }}
            onClick={() => setShowCreateModal(true)}
            className="p-6 rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-card/30 transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] group"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Create New Shop
            </span>
          </motion.button>
        </div>

        {shops.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground mb-4">
              You don't have any shops yet. Create your first shop to get started!
            </p>
          </motion.div>
        )}
      </main>

      <CreateShopModal 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
};

export default Shops;
