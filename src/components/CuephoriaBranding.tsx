import { motion } from "framer-motion";
import { ExternalLink, Code, Sparkles } from "lucide-react";

interface CuephoriaBrandingProps {
  variant?: "footer" | "subtle" | "inline" | "tag";
  className?: string;
}

export const CuephoriaBranding = ({ variant = "footer", className = "" }: CuephoriaBrandingProps) => {
  const baseClasses = "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group";
  
  if (variant === "tag") {
    return (
      <motion.a
        href="https://cuephoriatech.in"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary-900/30 dark:via-primary-900/20 dark:to-primary-900/30 border border-primary/30 dark:border-primary-800/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 group ${className}`}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Developed by Cuephoria Tech"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Code className="w-4 h-4 text-primary" />
        </motion.div>
        <span className="text-sm font-medium text-foreground">
          <span className="text-primary font-semibold">Cuephoria</span> Tech
        </span>
        <motion.div
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ExternalLink className="w-3.5 h-3.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ pointerEvents: "none" }}
        />
      </motion.a>
    );
  }
  
  if (variant === "subtle") {
    return (
      <motion.a
        href="https://cuephoriatech.in"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary-900/30 dark:via-primary-900/20 dark:to-primary-900/30 border border-primary/20 dark:border-primary-800/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group ${className}`}
        whileHover={{ scale: 1.05, y: -1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        aria-label="Developed by Cuephoria Tech"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
        >
          <Code className="w-3.5 h-3.5 text-primary" />
        </motion.div>
        <span className="text-xs font-medium text-foreground">
          <span className="text-primary font-semibold">Cuephoria</span> Tech
        </span>
        <motion.div
          animate={{ x: [0, 2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ExternalLink className="w-3 h-3 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </motion.a>
    );
  }

  if (variant === "inline") {
    return (
      <motion.a
        href="https://cuephoriatech.in"
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Developed by Cuephoria Tech"
      >
        <Code className="w-3.5 h-3.5 text-primary" />
        <span>Developed by <span className="font-semibold text-primary">Cuephoria Tech</span></span>
        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
      </motion.a>
    );
  }

  // Footer variant (default)
  return (
    <motion.a
      href="https://cuephoriatech.in"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary-900/30 dark:via-primary-900/20 dark:to-primary-900/30 border border-primary/20 dark:border-primary-800/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group ${className}`}
      whileHover={{ scale: 1.05, x: 2, y: -1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Developed by Cuephoria Tech"
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
      >
        <Code className="w-3.5 h-3.5 text-primary" />
      </motion.div>
      <span className="text-xs font-medium text-foreground">
        <span className="text-primary font-semibold">Cuephoria</span> Tech
      </span>
      <motion.div
        animate={{ x: [0, 2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ExternalLink className="w-3 h-3 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    </motion.a>
  );
};
