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
            "group toast group-[.toaster]:bg-card/95 dark:group-[.toaster]:bg-card/90 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border group-[.toaster]:border-primary-200/50 dark:group-[.toaster]:border-primary-800/30 group-[.toaster]:text-foreground group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-primary-50/50 group-[.toaster]:via-transparent group-[.toaster]:to-earth-50/50 dark:group-[.toaster]:from-primary-900/20 dark:group-[.toaster]:to-transparent",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-full group-[.toast]:hover:bg-primary/90",
          cancelButton: "group-[.toast]:bg-muted/50 group-[.toast]:text-muted-foreground group-[.toast]:rounded-full group-[.toast]:hover:bg-muted",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold group-[.toast]:text-base",
        },
      }}
      position="bottom-right"
      {...props}
    />
  );
};

export { Toaster, toast };
