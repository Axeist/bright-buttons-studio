import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, X } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              {variant !== "destructive" && (
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                </div>
              )}
              {variant === "destructive" && (
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-destructive/20 dark:bg-destructive/30 flex items-center justify-center shadow-sm">
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </div>
                </div>
              )}
              <div className="grid gap-0.5 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
