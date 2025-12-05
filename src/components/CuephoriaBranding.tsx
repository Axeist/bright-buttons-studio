import { motion } from "framer-motion";
import { ExternalLink, Code } from "lucide-react";

interface CuephoriaBrandingProps {
  variant?: "footer" | "subtle" | "inline";
  className?: string;
}

export const CuephoriaBranding = ({ variant = "footer", className = "" }: CuephoriaBrandingProps) => {
  const baseClasses = "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group";
  
  if (variant === "subtle") {
    return (
      <a
        href="https://tech.cuephoria.in"
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${className}`}
        aria-label="Developed by Cuephoria Tech"
      >
        <Code className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        <span className="opacity-60 group-hover:opacity-100 transition-opacity">Cuephoria Tech</span>
      </a>
    );
  }

  if (variant === "inline") {
    return (
      <motion.a
        href="https://tech.cuephoria.in"
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
      href="https://tech.cuephoria.in"
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${className}`}
      whileHover={{ scale: 1.05, x: 2 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Developed by Cuephoria Tech"
    >
      <Code className="w-3.5 h-3.5 text-primary" />
      <span>Developed by <span className="font-semibold text-primary">Cuephoria Tech</span></span>
      <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
    </motion.a>
  );
};

