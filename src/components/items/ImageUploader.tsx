import { useState, useRef } from 'react';
import { ImagePlus, X, Star, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageItem {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  shopId: string;
}

const ImageUploader = ({ images, onChange, shopId }: ImageUploaderProps) => {
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
        
        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported format. Use JPG, PNG, or WEBP.`,
            variant: "destructive"
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 5MB limit.`,
            variant: "destructive"
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${shopId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
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
          description: `${newImages.length} image(s) uploaded successfully.`
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
      
      // If removed image was primary, make first image primary
      if (image.isPrimary && updatedImages.length > 0) {
        updatedImages[0].isPrimary = true;
      }
      
      // Reorder remaining images
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
    
    // Update order
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Images</span>
        <span className="text-xs text-muted-foreground">{images.length} uploaded</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
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
              alt={`Item image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Drag handle */}
            <div className="absolute top-1 left-1 p-1 bg-background/80 rounded">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>

            {/* Primary badge */}
            {image.isPrimary && (
              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
                Primary
              </div>
            )}

            {/* Actions overlay */}
            <div className="absolute inset-0 bg-background/80 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {!image.isPrimary && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
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
                className="h-7 w-7"
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
          className="aspect-square rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-card/50 transition-all flex flex-col items-center justify-center gap-1"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImagePlus className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Add</span>
            </>
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
      
      <p className="text-xs text-muted-foreground">
        Drag to reorder. Click star to set primary image. Supports JPG, PNG, WEBP (max 5MB each).
      </p>
    </div>
  );
};

export default ImageUploader;
