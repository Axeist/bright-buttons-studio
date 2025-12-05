import { motion } from "framer-motion";
import { Leaf, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const techniques = ["Eco printing", "Tie & Dye", "Shibori", "Batik", "Kalamkari"];

const trustPoints = [
  { icon: Sparkles, text: "One-of-a-kind pieces" },
  { icon: Leaf, text: "Natural, chemical-free printing" },
  { icon: Heart, text: "Handmade in small batches" },
];

export const Hero = () => {
  const scrollToCollections = () => {
    document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative min-h-[90vh] gradient-hero overflow-hidden">
      {/* Enhanced Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-64 h-64 bg-primary-300/20 dark:bg-primary-700/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-earth-200/30 dark:bg-earth-800/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/3 w-48 h-48 bg-blush-200/20 dark:bg-blush-800/20 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 right-1/4 w-32 h-32 bg-primary-200/15 dark:bg-primary-800/15 rounded-full blur-xl"
        />
      </div>

      <div className="container-custom relative z-10 py-12 md:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 md:space-y-8"
          >
            {/* Enhanced Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-100 via-primary-50 to-primary-100 dark:from-primary-900/40 dark:via-primary-900/20 dark:to-primary-900/40 rounded-full text-sm text-primary-700 dark:text-primary-300 font-semibold shadow-lg border border-primary-200/50 dark:border-primary-800/50 backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Leaf className="w-4 h-4" />
              </motion.div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500 dark:from-primary-300 dark:to-primary-400">
                Eco-Printed · Handmade · One-of-a-Kind
              </span>
            </motion.div>

            {/* Enhanced Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-script text-gradient mb-2"
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="block"
              >
                Curator of
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="block bg-clip-text text-transparent bg-gradient-to-r from-primary-700 via-primary-500 to-earth-600 dark:from-primary-300 dark:via-primary-400 dark:to-earth-400"
              >
                Comfort & Style
              </motion.span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-lg"
            >
              Unique, eco-printed clothing where no two pieces are ever the same.
            </motion.p>

            {/* Technique Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2"
            >
              {techniques.map((technique, index) => (
                <span
                  key={technique}
                  className="px-3 py-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-full text-sm text-foreground"
                >
                  {technique}
                </span>
              ))}
            </motion.div>

            {/* Enhanced CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4 pt-6"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="rounded-full shadow-xl hover:shadow-2xl transition-all bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 hover:from-primary-600 hover:to-primary-800 dark:hover:from-primary-500 dark:hover:to-primary-700"
                  onClick={scrollToCollections}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Shop Now
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <WhatsAppButton variant="inline">
                  Chat on WhatsApp
                </WhatsAppButton>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right - Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative aspect-[3/4] max-w-md mx-auto lg:max-w-none">
              {/* Main Image Card */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-100 dark:from-primary-900/40 to-earth-100 dark:to-card rounded-3xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Leaf className="w-16 h-16 text-primary-500 dark:text-primary-400 mx-auto mb-4" />
                    <p className="text-primary-700 dark:text-primary-300 font-medium">Eco-Printed Fashion</p>
                    <p className="text-muted-foreground text-sm mt-2">Each piece tells a unique story</p>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -left-4 top-1/4 glass-card p-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Technique</p>
                    <p className="text-sm font-medium text-foreground">Eco Printing</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="absolute -right-4 bottom-1/4 glass-card p-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-earth-100 dark:bg-earth-800/40 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-earth-600 dark:text-earth-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Material</p>
                    <p className="text-sm font-medium text-foreground">Pure Silk</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Trust Points Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 md:mt-24"
        >
          <div className="glass rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {trustPoints.map((point, index) => (
                <div key={index} className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                    <point.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-foreground font-medium">{point.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
