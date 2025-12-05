import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Moon, Sparkles } from "lucide-react";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 hover:border-primary/40 transition-all duration-300 flex items-center justify-center group overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/10"
        animate={{
          scale: isDark ? [1, 1.2, 1] : [1, 1.2, 1],
          opacity: isDark ? [0.3, 0.5, 0.3] : [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Sparkle effects */}
      {isDark && (
        <>
          <motion.div
            className="absolute top-1 left-1 w-1 h-1 bg-primary rounded-full"
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
            className="absolute top-2 right-2 w-1 h-1 bg-primary rounded-full"
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
            className="absolute bottom-2 left-2 w-1 h-1 bg-primary rounded-full"
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

      {/* Icon container with rotation */}
      <motion.div
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="relative z-10"
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-primary" />
        ) : (
          <Sun className="w-5 h-5 text-primary" />
        )}
      </motion.div>

      {/* Hover effect - sparkles icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
      >
        <Sparkles className="w-4 h-4 text-primary/60" />
      </motion.div>
    </motion.button>
  );
};

