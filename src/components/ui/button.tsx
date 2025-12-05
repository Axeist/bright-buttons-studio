import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl",
        outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50 shadow-md hover:shadow-lg",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  fancy?: boolean; // New prop to enable fancy animations
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, fancy = true, ...props }, ref) => {
    const Comp = asChild ? Slot : fancy ? motion.button : "button";
    
    const buttonContent = (
      <>
        {/* Animated background glow for primary and destructive buttons */}
        {fancy && (variant === "default" || variant === "destructive") && (
          <motion.div
            className={`absolute inset-0 rounded-md ${
              variant === "default" ? "bg-primary/20" : "bg-destructive/20"
            }`}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Sparkle effects on hover - only for primary buttons */}
        {fancy && (variant === "default" || variant === "destructive") && (
          <>
            <motion.div
              className={`absolute top-1 left-1 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 ${
                variant === "default" ? "bg-primary-foreground/60" : "bg-destructive-foreground/60"
              }`}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.div
              className={`absolute top-1 right-1 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 ${
                variant === "default" ? "bg-primary-foreground/60" : "bg-destructive-foreground/60"
              }`}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.5,
              }}
            />
            <motion.div
              className={`absolute bottom-1 right-1 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 ${
                variant === "default" ? "bg-primary-foreground/60" : "bg-destructive-foreground/60"
              }`}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 1,
              }}
            />
          </>
        )}

        {/* Subtle glow for outline and secondary buttons */}
        {fancy && (variant === "outline" || variant === "secondary") && (
          <motion.div
            className="absolute inset-0 rounded-md bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        )}

        {/* Ripple effect on click */}
        {fancy && (
          <motion.span
            className="absolute inset-0 rounded-md bg-white/20"
            initial={{ scale: 0, opacity: 0.5 }}
            whileTap={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {props.children}
        </span>

        {/* Sparkles icon on hover for primary buttons */}
        {fancy && (variant === "default" || variant === "destructive") && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            initial={false}
          >
            <Sparkles className={`w-3 h-3 ${
              variant === "default" ? "text-primary-foreground/60" : "text-destructive-foreground/60"
            }`} />
          </motion.div>
        )}
      </>
    );

    if (asChild) {
      return <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
    }

    if (fancy) {
      return (
        <motion.button
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          {...props}
        >
          {buttonContent}
        </motion.button>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {buttonContent}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
