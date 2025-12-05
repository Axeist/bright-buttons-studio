import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Instagram, MessageCircle, Leaf, Palette, Scissors, Sparkles, Quote, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const expertise = [
  {
    icon: Leaf,
    title: "Eco-Printing",
    description: "Mastering the art of botanical printing using real leaves and natural mordants.",
    color: "from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40"
  },
  {
    icon: Palette,
    title: "Shibori & Tie-Dye",
    description: "Traditional Japanese and Indian resist-dyeing techniques with modern flair.",
    color: "from-earth-100 to-earth-200 dark:from-earth-800/40 dark:to-earth-700/40"
  },
  {
    icon: Scissors,
    title: "Batik & Kalamkari",
    description: "Hand-painted and wax-resist traditions passed down through generations.",
    color: "from-blush-100 to-blush-200 dark:from-blush-800/40 dark:to-blush-700/40"
  },
  {
    icon: Sparkles,
    title: "Custom Design & Styling",
    description: "Personalized consultations to create pieces that match your unique vision.",
    color: "from-primary-200 to-earth-200 dark:from-primary-800/40 dark:to-earth-800/40"
  }
];

export const FounderSection = () => {
  const bioRef = useRef(null);
  const isBioInView = useInView(bioRef, { once: true, margin: "-100px" });
  const expertiseRef = useRef(null);
  const isExpertiseInView = useInView(expertiseRef, { once: true, margin: "-100px" });

  const handleInstagram = () => {
    window.open("https://instagram.com/brightbuttons", "_blank");
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hi Subhiksha! I love your work at Bright Buttons and would love to know more.");
    window.open(`https://wa.me/919952655555?text=${message}`, "_blank");
  };

  return (
    <section id="founder" className="section-padding relative overflow-hidden bg-gradient-to-b from-background via-primary-50/30 to-background dark:from-background dark:via-primary-900/10 dark:to-background">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero opacity-40 dark:opacity-20" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-20 w-96 h-96 bg-primary-300/30 dark:bg-primary-700/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 25, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-20 left-20 w-80 h-80 bg-blush-200/40 dark:bg-blush-800/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-earth-200/30 dark:bg-earth-800/20 rounded-full blur-2xl"
        />
      </div>

      <div className="container-custom relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-6"
          >
            <motion.span 
              className="px-5 py-2.5 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 dark:from-primary-900/40 dark:via-primary-900/20 dark:to-primary-900/40 text-primary dark:text-primary-300 rounded-full text-sm font-semibold border border-primary/30 dark:border-primary-800/50 shadow-md backdrop-blur-sm"
              animate={{
                boxShadow: [
                  "0 4px 15px -3px rgba(16, 185, 129, 0.2)",
                  "0 6px 20px -3px rgba(16, 185, 129, 0.3)",
                  "0 4px 15px -3px rgba(16, 185, 129, 0.2)",
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              The Creative Force
            </motion.span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-script text-gradient mb-4 sm:mb-6">
            Meet Subhiksha
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The heart and soul behind Bright Buttons, bringing nature's magic to your wardrobe
          </p>
        </motion.div>

        {/* Bio Section */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20" ref={bioRef}>
          {/* Left - Portrait */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isBioInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative max-w-md mx-auto">
              {/* Main Portrait Circle */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isBioInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                className="aspect-square rounded-full bg-gradient-to-br from-primary-200 via-earth-200 to-blush-200 dark:from-primary-900/50 dark:via-earth-900/50 dark:to-blush-900/50 p-4 sm:p-6 shadow-2xl relative overflow-hidden mb-16 sm:mb-20"
              >
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.3),transparent_50%)]" />
                  <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(251,146,60,0.3),transparent_50%)]" />
                </div>

                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-50 via-earth-50 to-blush-50 dark:from-card dark:via-card dark:to-card flex items-center justify-center border-4 border-white dark:border-border relative z-10 overflow-hidden shadow-inner">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop&auto=format&q=80"
                    alt="Subhiksha Subramanian - Founder of Bright Buttons"
                    className="w-full h-full object-cover rounded-full scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-200/30 via-transparent to-earth-200/30 rounded-full" />
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-full" />
                </div>

                {/* Floating Decorative Elements */}
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-2 -right-2 w-16 h-16 bg-primary/20 dark:bg-primary-800/30 rounded-full blur-xl"
                />
                <motion.div
                  animate={{ 
                    y: [0, 10, 0],
                    rotate: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.5
                  }}
                  className="absolute -bottom-2 -left-2 w-20 h-20 bg-earth-300/20 dark:bg-earth-700/30 rounded-full blur-xl"
                />
              </motion.div>

              {/* Decorative Rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-primary-200 dark:border-primary-800/50 opacity-50"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border border-dotted border-earth-300 dark:border-earth-700/50 opacity-30"
              />
              
              {/* Badge - Better positioned */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={isBioInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5, type: "spring", stiffness: 200 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-gradient-to-r from-primary via-primary-600 to-primary-700 dark:from-primary-600 dark:via-primary-700 dark:to-primary-800 text-white rounded-full text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2 z-20 border-2 border-white/20 backdrop-blur-sm"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap">Founder & Creative Director</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Right - Bio Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isBioInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <motion.h3 
                className="text-2xl sm:text-3xl md:text-4xl font-script text-gradient mb-3 sm:mb-4"
                animate={isBioInView ? {} : {}}
              >
                Subhiksha Subramanian
              </motion.h3>
              <motion.div 
                className="h-1.5 w-32 bg-gradient-to-r from-primary via-primary-500 to-transparent rounded-full mb-6"
                initial={{ width: 0 }}
                animate={isBioInView ? { width: 128 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                My journey with eco-fashion began with a simple question: <span className="text-foreground font-medium">Why can't we wear clothes that celebrate our individuality while respecting our planet?</span> This question led me to explore ancient textile traditions – eco-printing, shibori, batik, and kalamkari – and reimagine them for the modern wardrobe.
              </p>

              <p>
                At Bright Buttons, every piece I create is a <span className="text-primary font-medium">labor of love</span>. I work closely with skilled artisans who've inherited their craft through generations, combining their expertise with my contemporary designs. The result? Wearable art that's as unique as the person wearing it.
              </p>

              <p>
                What brings me the most joy is collaborating with customers on custom pieces. Whether it's a bridal ensemble, matching family outfits, or a special gift – I love bringing your vision to life with <span className="text-foreground font-medium">nature's palette</span>.
              </p>
            </div>

            {/* Quote Card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={isBioInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4, type: "spring" }}
              className="glass-card p-6 md:p-8 mt-8 relative overflow-hidden border-2 border-primary/20 dark:border-primary/30 shadow-xl"
            >
              {/* Animated background gradient */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-earth-50/50 dark:from-primary-900/20 dark:to-earth-900/20"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 dark:bg-primary-900/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-earth-200/20 dark:bg-earth-800/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Quote className="w-10 h-10 text-primary mb-4 opacity-60" />
                </motion.div>
                <blockquote className="text-foreground italic text-base sm:text-lg mb-4 leading-relaxed font-medium">
                  "I believe every garment should carry a piece of nature's magic and the warmth of human hands. At Bright Buttons, we don't just make clothes—we create wearable art that makes you feel special and look beautiful, naturally."
                </blockquote>
                <div className="flex items-center gap-2 pt-2 border-t border-primary/20">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Heart className="w-4 h-4 text-primary fill-primary" />
                  </motion.div>
                  <p className="text-primary font-script text-base sm:text-lg">— Subhiksha Subramanian</p>
                </div>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isBioInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-6"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleInstagram} 
                  variant="outline" 
                  className="w-full sm:w-auto rounded-full border-2 hover:border-primary/50 transition-all shadow-md hover:shadow-lg min-h-[48px]"
                  size="lg"
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Follow Her Journey
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleWhatsApp} 
                  className="w-full sm:w-auto rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white transition-all shadow-lg hover:shadow-xl min-h-[48px]"
                  size="lg"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Say Hello on WhatsApp
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Expertise Section */}
        <div ref={expertiseRef}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isExpertiseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-script text-gradient mb-3 sm:mb-4">
              Her Craft & Expertise
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Years of practice and passion have honed these skills to create truly exceptional pieces.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {expertise.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isExpertiseInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="glass-card p-6 text-center hover-lift group relative overflow-hidden"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-800/60 transition-colors"
                  >
                    <item.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </motion.div>
                  <h4 className="font-semibold text-foreground mb-2 text-lg">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

