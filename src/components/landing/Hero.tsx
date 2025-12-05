import { memo } from "react";
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

export const Hero = memo(() => {
  const scrollToCollections = () => {
    document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative min-h-[90vh] gradient-hero overflow-hidden">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5 z-0">
        <img 
          src="https://source.unsplash.com/q1-dAZuhs7I/1920x1080"
          alt="Green leaf macro photography background - eco printing theme"
          className="w-full h-full object-cover"
          loading="eager"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      {/* Enhanced Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut",
            type: "tween"
          }}
          style={{ willChange: "transform" }}
          className="absolute top-20 left-10 w-64 h-64 bg-primary-300/20 dark:bg-primary-700/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut", 
            delay: 1,
            type: "tween"
          }}
          style={{ willChange: "transform" }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-earth-200/30 dark:bg-earth-800/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ 
            duration: 7, 
            repeat: Infinity, 
            ease: "easeInOut", 
            delay: 2,
            type: "tween"
          }}
          style={{ willChange: "transform" }}
          className="absolute top-1/2 left-1/3 w-48 h-48 bg-blush-200/20 dark:bg-blush-800/20 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear",
            type: "tween"
          }}
          style={{ willChange: "transform" }}
          className="absolute top-1/4 right-1/4 w-32 h-32 bg-primary-200/15 dark:bg-primary-800/15 rounded-full blur-xl"
        />
      </div>

      <div className="container-custom relative z-10 py-8 sm:py-12 md:py-20 lg:py-24">
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
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-script text-gradient mb-3 sm:mb-4"
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="block"
            >
                Nature's Artistry
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="block bg-clip-text text-transparent bg-gradient-to-r from-primary-700 via-primary-500 to-earth-600 dark:from-primary-300 dark:via-primary-400 dark:to-earth-400"
              >
                Woven into Fashion
              </motion.span>
            </motion.h1>

            {/* Enhanced Subheading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2 sm:space-y-3 max-w-lg"
            >
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                Where every leaf tells a story, and every garment carries nature's unique signature. 
                Experience the magic of eco-printing, where real botanicals meet premium fabrics.
              </p>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground/80 leading-relaxed">
                Each piece is handcrafted using ancient techniques passed down through generations, 
                creating wearable art that's as unique as you are.
              </p>
            </motion.div>

            {/* Enhanced Technique Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              {techniques.map((technique, index) => (
                <motion.span
                  key={technique}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="group relative px-3 sm:px-4 py-2 bg-gradient-to-r from-primary-50 via-primary-100/50 to-earth-50 dark:from-primary-900/30 dark:via-primary-800/20 dark:to-card border border-primary-200/60 dark:border-primary-800/40 rounded-full text-xs sm:text-sm font-medium text-primary-700 dark:text-primary-300 shadow-md hover:shadow-lg transition-all duration-300 cursor-default overflow-hidden"
                >
                  {/* Animated background on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-800/40 dark:to-primary-700/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"
                  />
                  
                  {/* Decorative dot */}
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary-400 dark:bg-primary-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                  
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Leaf className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                  {technique}
                </span>
                </motion.span>
              ))}
            </motion.div>

            {/* Enhanced CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-4 sm:pt-6"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 sm:flex-initial"
              >
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto h-12 sm:h-11 px-6 sm:px-8 rounded-full shadow-xl hover:shadow-2xl transition-all bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 hover:from-primary-600 hover:to-primary-800 dark:hover:from-primary-500 dark:hover:to-primary-700"
                  onClick={scrollToCollections}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Shop Now
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 sm:flex-initial"
              >
                <WhatsAppButton variant="inline" className="w-full sm:w-auto">
                  Chat on WhatsApp
                </WhatsAppButton>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right - Process Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative max-w-lg mx-auto lg:max-w-none">
              {/* Main Showcase Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{ willChange: "transform" }}
                className="relative bg-gradient-to-br from-primary-50 via-earth-50 to-blush-50 dark:from-primary-900/20 dark:via-card dark:to-card rounded-3xl shadow-2xl overflow-hidden border border-primary-200/50 dark:border-primary-800/30 p-8 md:p-10"
              >
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    animate={{
                      x: [0, 50, 0],
                      y: [0, 30, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 8, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      type: "tween"
                    }}
                    style={{ willChange: "transform" }}
                    className="absolute -top-10 -left-10 w-40 h-40 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-2xl"
                  />
                  <motion.div
                    animate={{
                      x: [0, -40, 0],
                      y: [0, -20, 0],
                      scale: [1, 1.3, 1]
                    }}
                    transition={{ 
                      duration: 10, 
                      repeat: Infinity, 
                      ease: "easeInOut", 
                      delay: 1,
                      type: "tween"
                    }}
                    style={{ willChange: "transform" }}
                    className="absolute -bottom-10 -right-10 w-48 h-48 bg-earth-200/30 dark:bg-earth-800/20 rounded-full blur-2xl"
                  />
                </div>

                <div className="relative z-10 space-y-6">
                  {/* Header */}
                  <div className="text-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-block mb-4"
                    >
                      <div className="relative">
                        <Leaf className="w-16 h-16 text-primary-500 dark:text-primary-400 mx-auto" />
                        <motion.div
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.4, 0.7, 0.4]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-primary-400/30 dark:bg-primary-500/20 rounded-full blur-xl"
                        />
                  </div>
                    </motion.div>
                    <h3 className="text-2xl md:text-3xl font-script text-primary-700 dark:text-primary-300 mb-2">
                      The Art of Eco-Printing
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Where nature meets craftsmanship
                    </p>
                  </div>

                  {/* Process Steps */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Leaf, label: "Leaf Selection", color: "primary" },
                      { icon: Sparkles, label: "Natural Dyes", color: "earth" },
                      { icon: Heart, label: "Handcrafted", color: "primary" },
                      { icon: Sparkles, label: "Unique Prints", color: "earth" }
                    ].map((step, index) => (
              <motion.div
                        key={step.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="glass-card p-4 text-center group cursor-default"
              >
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                          step.color === "primary" 
                            ? "from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50" 
                            : "from-earth-100 to-earth-200 dark:from-earth-800/50 dark:to-earth-700/50"
                        } flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-shadow`}>
                          <step.icon className={`w-6 h-6 ${
                            step.color === "primary" 
                              ? "text-primary-600 dark:text-primary-400" 
                              : "text-earth-600 dark:text-earth-400"
                          }`} />
                        </div>
                        <p className="text-xs font-semibold text-foreground">{step.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Key Features */}
                  <div className="pt-4 border-t border-primary-200/50 dark:border-primary-800/30">
                    <div className="flex flex-wrap justify-center gap-3">
                      {["100% Natural", "One-of-a-Kind", "Handmade"].map((feature, index) => (
                        <motion.span
                          key={feature}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.2 + index * 0.1 }}
                          className="px-3 py-1 bg-primary-100/80 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full border border-primary-200/50 dark:border-primary-800/50"
                        >
                          {feature}
                        </motion.span>
                      ))}
                    </div>
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
});

Hero.displayName = "Hero";
