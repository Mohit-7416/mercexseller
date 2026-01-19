-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for uploading images (shop owners only)
CREATE POLICY "Shop owners can upload item images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'item-images' AND
  auth.uid() IS NOT NULL
);

-- Create policy for viewing images (public)
CREATE POLICY "Item images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

-- Create policy for deleting images (shop owners)
CREATE POLICY "Shop owners can delete their item images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'item-images' AND
  auth.uid() IS NOT NULL
);

-- Create policy for updating images
CREATE POLICY "Shop owners can update their item images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'item-images' AND
  auth.uid() IS NOT NULL
);