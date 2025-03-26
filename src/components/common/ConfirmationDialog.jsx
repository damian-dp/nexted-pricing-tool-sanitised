import PropTypes from "prop-types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoaderIcon } from "lucide-react";

/**
 * A reusable confirmation dialog component
 */
export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText,
    cancelText = "Cancel",
    confirmVariant = "destructive",
    onConfirm,
    isLoading = false,
    loadingText,
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={
                            confirmVariant === "destructive"
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : ""
                        }
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                                {loadingText || confirmText}
                            </>
                        ) : (
                            confirmText
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

ConfirmationDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onOpenChange: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.node.isRequired,
    confirmText: PropTypes.string.isRequired,
    cancelText: PropTypes.string,
    confirmVariant: PropTypes.oneOf(["default", "destructive"]),
    onConfirm: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    loadingText: PropTypes.string,
};

export default ConfirmationDialog;
