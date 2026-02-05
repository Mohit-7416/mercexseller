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
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';

export type ActionType = 'delete' | 'update';

interface ConfirmActionDialogProps {
  open: boolean;
  actionType: ActionType;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmActionDialog = ({
  open,
  actionType,
  itemName,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmActionDialogProps) => {
  const isDelete = actionType === 'delete';

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDelete ? 'bg-destructive/10' : 'bg-primary/10'
            }`}>
              {isDelete ? (
                <Trash2 className="w-6 h-6 text-destructive" />
              ) : (
                <RefreshCw className="w-6 h-6 text-primary" />
              )}
            </div>
            <AlertDialogTitle className="text-xl">
              {isDelete ? 'Delete Item?' : 'Update Item?'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            {isDelete ? (
              <>
                <p>
                  Are you sure you want to delete <strong className="text-foreground">"{itemName}"</strong>?
                </p>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">
                    This action cannot be undone. All variants, images, and inventory data associated with this item will be permanently removed.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p>
                  You are about to update <strong className="text-foreground">"{itemName}"</strong>.
                </p>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-2">
                  <RefreshCw className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    This will save all changes to the item including variants, pricing, and inventory. Make sure all information is correct before proceeding.
                  </p>
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={isDelete ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {isDelete ? 'Deleting...' : 'Updating...'}
              </span>
            ) : (
              isDelete ? 'Yes, Delete Item' : 'Yes, Update Item'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmActionDialog;
