import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, RefreshCw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type DuplicateAction = 'update' | 'delete' | 'cancel';

interface DuplicateItemDialogProps {
  open: boolean;
  itemName: string;
  existingItemId: string;
  onAction: (action: DuplicateAction) => void;
}

const DuplicateItemDialog = ({
  open,
  itemName,
  onAction,
}: DuplicateItemDialogProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              Duplicate Item Detected
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            An item with the name <strong className="text-foreground">"{itemName}"</strong> already exists in your inventory.
            <br /><br />
            Please choose an action to proceed:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3 px-4"
            onClick={() => onAction('update')}
          >
            <RefreshCw className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="font-medium">Update Existing Record</p>
              <p className="text-xs text-muted-foreground">
                Replace the existing item data with the new information
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3 px-4 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5"
            onClick={() => onAction('delete')}
          >
            <Trash2 className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Delete Existing Record</p>
              <p className="text-xs text-muted-foreground">
                Remove the existing item and create a new one
              </p>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-3 px-4"
            onClick={() => onAction('cancel')}
          >
            <X className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Cancel Operation</p>
              <p className="text-xs text-muted-foreground">
                Go back and modify the item name
              </p>
            </div>
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DuplicateItemDialog;
