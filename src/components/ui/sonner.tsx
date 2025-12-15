import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 dark:group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border group-[.toaster]:border-primary-300/50 dark:group-[.toaster]:border-primary-700/50 group-[.toaster]:text-foreground group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-primary-50/40 group-[.toaster]:via-transparent group-[.toaster]:to-earth-50/40 dark:group-[.toaster]:from-primary-900/20 dark:group-[.toaster]:to-transparent group-[.toaster]:hover:shadow-xl group-[.toaster]:transition-shadow group-[.toaster]:p-3",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:opacity-85 group-[.toast]:leading-relaxed",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-full group-[.toast]:hover:bg-primary/90 group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5",
          cancelButton: "group-[.toast]:bg-muted/50 group-[.toast]:text-muted-foreground group-[.toast]:rounded-full group-[.toast]:hover:bg-muted group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold group-[.toast]:text-sm group-[.toast]:leading-tight",
        },
      }}
      position="top-right"
      {...props}
    />
  );
};

export { Toaster, toast };
