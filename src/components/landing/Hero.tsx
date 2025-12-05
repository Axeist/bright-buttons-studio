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
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-earth-200/30 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-blush-200/20 rounded-full blur-2xl animate-pulse-soft" />
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
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full text-sm text-primary-700 dark:text-primary-300 font-medium"
            >
              <Leaf className="w-4 h-4" />
              Eco-Printed · Handmade · One-of-a-Kind
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-script text-gradient leading-tight"
            >
              Curator of Comfort & Style
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

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <Button size="lg" className="rounded-full" onClick={scrollToCollections}>
                Shop Now
              </Button>
              <WhatsAppButton variant="inline">
                Chat on WhatsApp
              </WhatsAppButton>
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
