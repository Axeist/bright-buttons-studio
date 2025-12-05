import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Construction, Wrench, Sparkles, Calendar, Rocket } from "lucide-react";

export const ConstructionPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Show popup after 3 seconds - always show
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    // Update current date
    const updateCurrentDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setCurrentDate(now.toLocaleDateString('en-US', options));
    };

    // Calculate time remaining until Jan 10th, 2026
    const calculateTimeRemaining = () => {
      const now = new Date();
      const deadline = new Date("2026-01-10T23:59:59");
      const diff = deadline.getTime() - now.getTime();

      // Calculate progress percentage (assuming we started from a certain date)
      const totalDuration = deadline.getTime() - new Date("2024-12-01T00:00:00").getTime();
      const elapsed = totalDuration - diff;
      const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      setProgress(progressPercent);

      if (diff <= 0) {
        setTimeRemaining("Grand Opening Soon!");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hour${hours > 1 ? 's' : ''} ${minutes} min${minutes > 1 ? 's' : ''}`);
      } else {
        setTimeRemaining(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      }
    };

    updateCurrentDate();
    calculateTimeRemaining();
    
    const dateInterval = setInterval(updateCurrentDate, 60000); // Update every minute
    const countdownInterval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => {
      clearTimeout(timer);
      clearInterval(dateInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  const handleClose = () => {
    setIsClosed(true);
  };

  if (isClosed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />

          {/* Popup Container - Perfect Centering */}
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.3, y: 100, rotate: -15 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0, 
                rotate: 0,
                x: [0, -5, 5, -3, 3, 0],
              }}
              exit={{ opacity: 0, scale: 0.3, y: 100, rotate: 15 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                duration: 0.8,
                x: {
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }
              }}
              className="w-full max-w-md pointer-events-auto"
            >
            <motion.div 
              className="relative bg-gradient-to-br from-primary-50 via-blush-50 to-earth-50 dark:from-card dark:via-card dark:to-card rounded-3xl shadow-2xl border-2 border-primary/30 dark:border-primary/20 overflow-hidden"
              animate={{
                boxShadow: [
                  "0 20px 60px -15px rgba(0, 0, 0, 0.3)",
                  "0 25px 70px -10px rgba(16, 185, 129, 0.4)",
                  "0 20px 60px -15px rgba(0, 0, 0, 0.3)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -top-10 -right-10 w-32 h-32 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-2xl"
                />
                <motion.div
                  animate={{
                    rotate: [360, 0],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -bottom-10 -left-10 w-40 h-40 bg-blush-200/30 dark:bg-blush-800/20 rounded-full blur-2xl"
                />
              </div>

              {/* Content */}
              <div className="relative z-10 p-5 sm:p-6 md:p-8">
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-background/80 dark:bg-background/60 hover:bg-background dark:hover:bg-background flex items-center justify-center transition-colors z-20 group touch-target"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 sm:w-4 sm:h-4 text-foreground group-hover:rotate-90 transition-transform" />
                </button>

                {/* Header with Animated Icons */}
                <div className="text-center mb-6">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="inline-block mb-4"
                  >
                    <div className="relative">
                      <Construction className="w-16 h-16 text-primary mx-auto" />
                      <motion.div
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity
                        }}
                        className="absolute inset-0 bg-primary/30 rounded-full blur-xl"
                      />
                    </div>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0
                    }}
                    transition={{ 
                      delay: 0.2,
                      duration: 0.5
                    }}
                    className="text-xl sm:text-2xl md:text-3xl font-script text-primary mb-2"
                  >
                    <motion.span
                      animate={{ 
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: "easeInOut"
                      }}
                      className="inline-block"
                    >
                      🚧
                    </motion.span>
                    {" "}Under Construction!{" "}
                    <motion.span
                      animate={{ 
                        rotate: [0, -5, 5, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2.5,
                        ease: "easeInOut"
                      }}
                      className="inline-block"
                    >
                      🚧
                    </motion.span>
                  </motion.h2>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1
                    }}
                    transition={{ 
                      delay: 0.3,
                      duration: 0.5
                    }}
                    className="text-xs sm:text-sm text-muted-foreground"
                  >
                    We're building something amazing! 🎉✨
                  </motion.p>
                </div>

                {/* Funny Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0
                  }}
                  transition={{ 
                    delay: 0.4,
                    duration: 0.5
                  }}
                  className="bg-white/80 dark:bg-background/80 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-primary/20 relative overflow-hidden"
                >
                  {/* Subtle animated background pattern */}
                  <motion.div
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 15,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute inset-0 opacity-3 bg-gradient-to-r from-transparent via-primary to-transparent"
                  />
                  
                  <div className="flex items-start gap-3 relative z-10">
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: "easeInOut"
                      }}
                      className="text-3xl flex-shrink-0"
                    >
                      👷‍♀️
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed mb-2">
                        <span className="font-semibold text-primary">Oops!</span>{" "}
                        Our website is still being polished by the amazing team at{" "}
                        <span className="font-semibold text-primary">Cuephoria Tech</span>!{" "}
                        <span className="inline-block">🎨</span>
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Some features might be a bit wonky, but we're working hard to make everything perfect!{" "}
                        <span className="inline-block">💪</span>
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Current Date */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-3 mb-3 border border-primary/20"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Today: <span className="text-foreground font-semibold">{currentDate}</span>
                    </p>
                  </div>
                </motion.div>

                {/* Grand Opening Countdown */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="bg-gradient-to-r from-primary-100 to-blush-100 dark:from-primary-900/40 dark:to-blush-900/40 rounded-2xl p-4 mb-4 border border-primary/30"
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: "easeInOut"
                      }}
                    >
                      <Rocket className="w-5 h-5 text-primary" />
                    </motion.div>
                    <span className="text-sm font-semibold text-foreground">
                      Grand Opening Date
                    </span>
                    <motion.div
                      animate={{
                        rotate: [0, -5, 5, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatDelay: 2.5,
                        ease: "easeInOut"
                      }}
                    >
                      <Rocket className="w-5 h-5 text-primary" />
                    </motion.div>
                  </div>
                  <div className="text-center mb-3">
                    <motion.div
                      key={timeRemaining}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0
                      }}
                      transition={{
                        duration: 0.5
                      }}
                      className="text-lg sm:text-2xl font-bold text-primary mb-1"
                    >
                      {timeRemaining}
                    </motion.div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Until Jan 10th, 2026
                    </p>
                  </div>
                  
                  {/* Fancy Progress Loader */}
                  <div className="relative">
                    <div className="h-3 bg-background/50 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary via-blush-500 via-primary-500 to-primary rounded-full relative overflow-hidden"
                      >
                        {/* Animated shimmer effect */}
                        <motion.div
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        />
                        {/* Pulsing dots */}
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.3,
                              ease: "easeInOut"
                            }}
                            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"
                            style={{ left: `${20 + i * 30}%` }}
                          />
                        ))}
                      </motion.div>
                    </div>
                    {/* Progress percentage */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="absolute -top-5 right-0 text-[10px] font-bold text-primary"
                    >
                      {Math.round(progress)}%
                    </motion.div>
                  </div>
                </motion.div>

                {/* Cuephoria Tech Branding */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center pt-2 border-t border-border/50"
                >
                  <span className="text-xs text-muted-foreground">Built with {'<3'} by <span className="font-semibold text-primary">Cuephoria Tech</span></span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

