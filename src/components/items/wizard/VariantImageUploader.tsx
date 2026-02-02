import { useState, useRef } from 'react';
import { ImagePlus, X, Star, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageItem } from '../ItemWizard';

interface VariantImageUploaderProps {
  variantId: string;
  variantLabel: string;
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  shopId: string;
}

const VariantImageUploader = ({ 
  variantId, 
  variantLabel, 
  images, 
  onChange, 
  shopId 
}: VariantImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: ImageItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not supported. Use JPG, PNG, or WEBP.`,
            variant: "destructive"
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 5MB limit.`,
            variant: "destructive"
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${shopId}/${variantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        newImages.push({
          id: fileName,
          url: publicUrl,
          isPrimary: images.length === 0 && newImages.length === 0,
          order: images.length + newImages.length
        });
      }

      onChange([...images, ...newImages]);
      
      if (newImages.length > 0) {
        toast({
          title: "Images uploaded",
          description: `${newImages.length} image(s) uploaded for ${variantLabel}.`
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload error",
        description: "An error occurred while uploading images.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (image: ImageItem) => {
    try {
      await supabase.storage
        .from('item-images')
        .remove([image.id]);

      const updatedImages = images.filter(img => img.id !== image.id);
      
      if (image.isPrimary && updatedImages.length > 0) {
        updatedImages[0].isPrimary = true;
      }
      
      updatedImages.forEach((img, idx) => {
        img.order = idx;
      });
      
      onChange(updatedImages);
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const handleSetPrimary = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    onChange(updatedImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    newImages.forEach((img, idx) => {
      img.order = idx;
    });
    
    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-move
              ${image.isPrimary ? 'border-primary' : 'border-border/50'}
              ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
            `}
          >
            <img
              src={image.url}
              alt={`${variantLabel} image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute top-0.5 left-0.5 p-0.5 bg-background/80 rounded">
              <GripVertical className="w-2 h-2 text-muted-foreground" />
            </div>

            {image.isPrimary && (
              <div className="absolute top-0.5 right-0.5 px-1 py-0.5 bg-primary text-primary-foreground text-[8px] font-medium rounded">
                1st
              </div>
            )}

            <div className="absolute inset-0 bg-background/80 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {!image.isPrimary && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleSetPrimary(image.id)}
                  title="Set as primary"
                >
                  <Star className="w-3 h-3" />
                </Button>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemove(image)}
                title="Remove"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}

        {/* Add Image Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-card/50 transition-all flex flex-col items-center justify-center"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default VariantImageUploader;
