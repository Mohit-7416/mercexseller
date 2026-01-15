-- Create enums
CREATE TYPE public.listing_type AS ENUM ('auction', 'live_sale');
CREATE TYPE public.listing_status AS ENUM ('draft', 'scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE public.bid_status AS ENUM ('active', 'won', 'outbid', 'cancelled');

-- Profiles table (seller accounts)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT NOT NULL DEFAULT '',
  gender TEXT,
  age INTEGER,
  aadhaar_number TEXT,
  address_line TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  postal_code TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Shops table (sellers can have multiple shops)
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gst_number TEXT,
  address_line TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  postal_code TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shops"
  ON public.shops FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own shops"
  ON public.shops FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own shops"
  ON public.shops FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own shops"
  ON public.shops FOR DELETE
  USING (auth.uid() = owner_id);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

-- Sub-categories table
CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subcategories"
  ON public.subcategories FOR SELECT
  USING (true);

-- Items (Inventory) table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  subcategory_id UUID REFERENCES public.subcategories(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2),
  sku TEXT,
  variants JSONB DEFAULT '[]'::jsonb,
  dimensions JSONB,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shop items"
  ON public.items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = items.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Users can create items in their shops"
  ON public.items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = items.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Users can update their shop items"
  ON public.items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = items.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Users can delete their shop items"
  ON public.items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = items.shop_id AND shops.owner_id = auth.uid()));

-- Listings table (auctions and live sales)
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  listing_code TEXT NOT NULL UNIQUE,
  type listing_type NOT NULL,
  status listing_status NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  subcategory_id UUID REFERENCES public.subcategories(id),
  thumbnail_url TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  starting_price DECIMAL(10,2),
  current_price DECIMAL(10,2),
  reserve_price DECIMAL(10,2),
  viewers_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shop listings"
  ON public.listings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = listings.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Users can create listings in their shops"
  ON public.listings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = listings.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Users can update their shop listings"
  ON public.listings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = listings.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Users can delete their shop listings"
  ON public.listings FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = listings.shop_id AND shops.owner_id = auth.uid()));

-- Listing Items (items included in a listing)
CREATE TABLE public.listing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their listing items"
  ON public.listing_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.listings l
    JOIN public.shops s ON s.id = l.shop_id
    WHERE l.id = listing_items.listing_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "Users can manage their listing items"
  ON public.listing_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.listings l
    JOIN public.shops s ON s.id = l.shop_id
    WHERE l.id = listing_items.listing_id AND s.owner_id = auth.uid()
  ));

-- Bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status bid_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view bids on their listings"
  ON public.bids FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.listings l
    JOIN public.shops s ON s.id = l.shop_id
    WHERE l.id = bids.listing_id AND s.owner_id = auth.uid()
  ));

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id),
  buyer_id UUID REFERENCES auth.users(id),
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  shipping_address JSONB,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shop orders"
  ON public.orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Users can create orders in their shops"
  ON public.orders FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Users can update their shop orders"
  ON public.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()));

-- Order Items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.shops s ON s.id = o.shop_id
    WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "Users can manage their order items"
  ON public.order_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.shops s ON s.id = o.shop_id
    WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()
  ));

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
  ('Jewelry & Accessories', 'Rings, necklaces, bracelets, earrings, and other accessories'),
  ('Fashion & Apparel', 'Clothing, footwear, and fashion items'),
  ('Home & Decor', 'Furniture, decorations, and home accessories'),
  ('Electronics', 'Electronic devices and gadgets'),
  ('Art & Collectibles', 'Artworks, antiques, and collectible items'),
  ('Books & Media', 'Books, movies, music, and other media'),
  ('Sports & Outdoors', 'Sports equipment and outdoor gear'),
  ('Other', 'Other items');

-- Insert subcategories
INSERT INTO public.subcategories (category_id, name) VALUES
  ((SELECT id FROM public.categories WHERE name = 'Jewelry & Accessories'), 'Rings'),
  ((SELECT id FROM public.categories WHERE name = 'Jewelry & Accessories'), 'Necklaces'),
  ((SELECT id FROM public.categories WHERE name = 'Jewelry & Accessories'), 'Bracelets'),
  ((SELECT id FROM public.categories WHERE name = 'Jewelry & Accessories'), 'Earrings'),
  ((SELECT id FROM public.categories WHERE name = 'Jewelry & Accessories'), 'Watches'),
  ((SELECT id FROM public.categories WHERE name = 'Fashion & Apparel'), 'Men''s Clothing'),
  ((SELECT id FROM public.categories WHERE name = 'Fashion & Apparel'), 'Women''s Clothing'),
  ((SELECT id FROM public.categories WHERE name = 'Fashion & Apparel'), 'Footwear'),
  ((SELECT id FROM public.categories WHERE name = 'Fashion & Apparel'), 'Bags'),
  ((SELECT id FROM public.categories WHERE name = 'Home & Decor'), 'Furniture'),
  ((SELECT id FROM public.categories WHERE name = 'Home & Decor'), 'Lighting'),
  ((SELECT id FROM public.categories WHERE name = 'Home & Decor'), 'Wall Art'),
  ((SELECT id FROM public.categories WHERE name = 'Home & Decor'), 'Rugs & Carpets'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Mobile Phones'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Laptops'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Audio'),
  ((SELECT id FROM public.categories WHERE name = 'Art & Collectibles'), 'Paintings'),
  ((SELECT id FROM public.categories WHERE name = 'Art & Collectibles'), 'Sculptures'),
  ((SELECT id FROM public.categories WHERE name = 'Art & Collectibles'), 'Antiques'),
  ((SELECT id FROM public.categories WHERE name = 'Art & Collectibles'), 'Coins & Stamps');