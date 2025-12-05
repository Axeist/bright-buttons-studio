import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Instagram, MessageCircle, Leaf, Palette, Scissors, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const expertise = [
  {
    icon: Leaf,
    title: "Eco-Printing",
    description: "Mastering the art of botanical printing using real leaves and natural mordants."
  },
  {
    icon: Palette,
    title: "Shibori & Tie-Dye",
    description: "Traditional Japanese and Indian resist-dyeing techniques with modern flair."
  },
  {
    icon: Scissors,
    title: "Batik & Kalamkari",
    description: "Hand-painted and wax-resist traditions passed down through generations."
  },
  {
    icon: Sparkles,
    title: "Custom Design & Styling",
    description: "Personalized consultations to create pieces that match your unique vision."
  }
];

const AboutFounder = () => {
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
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 bg-primary-300/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-blush-200/30 rounded-full blur-3xl animate-float-delayed" />
        </div>

        <div className="container-custom relative z-10 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-script text-gradient mb-4">
              Meet Subhiksha
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              The heart and soul behind Bright Buttons
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bio Section */}
      <section className="section-padding bg-background" ref={bioRef}>
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Portrait */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isBioInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative max-w-md mx-auto">
                {/* Portrait Circle */}
                <div className="aspect-square rounded-full bg-gradient-to-br from-primary-100 to-earth-100 p-4 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-50 to-blush-50 flex items-center justify-center border-4 border-white">
                    <div className="text-center">
                      <span className="text-6xl">👩‍🎨</span>
                      <p className="text-primary-700 font-medium mt-4">Subhiksha Subramanian</p>
                    </div>
                  </div>
                </div>

                {/* Decorative Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary-200 animate-spin" style={{ animationDuration: '30s' }} />
                
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isBioInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-lg"
                >
                  Founder & Creative Director
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
              <h2 className="text-3xl md:text-4xl font-script text-gradient">
                Subhiksha Subramanian
              </h2>

              <p className="text-muted-foreground leading-relaxed">
                My journey with eco-fashion began with a simple question: Why can't we wear clothes that 
                celebrate our individuality while respecting our planet? This question led me to explore 
                ancient textile traditions – eco-printing, shibori, batik, and kalamkari – and reimagine 
                them for the modern wardrobe.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                At Bright Buttons, every piece I create is a labor of love. I work closely with skilled 
                artisans who've inherited their craft through generations, combining their expertise with 
                my contemporary designs. The result? Wearable art that's as unique as the person wearing it.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                What brings me the most joy is collaborating with customers on custom pieces. Whether it's 
                a bridal ensemble, matching family outfits, or a special gift – I love bringing your vision 
                to life with nature's palette.
              </p>

              {/* Quote Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isBioInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="glass-card p-6 mt-8"
              >
                <blockquote className="text-foreground italic mb-4">
                  "I believe every garment should carry a piece of nature's magic and the warmth of 
                  human hands. At Bright Buttons, we don't just make clothes—we create wearable art 
                  that makes you feel special and look beautiful, naturally."
                </blockquote>
                <p className="text-primary font-script text-lg">— Subhiksha Subramanian</p>
              </motion.div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Button onClick={handleInstagram} variant="outline" className="rounded-full">
                  <Instagram className="w-4 h-4 mr-2" />
                  Follow Her Journey
                </Button>
                <Button onClick={handleWhatsApp} className="rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Say Hello on WhatsApp
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="section-padding gradient-earth" ref={expertiseRef}>
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isExpertiseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-script text-gradient mb-4">
              Her Craft & Expertise
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
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
                className="glass-card p-6 text-center hover-lift"
              >
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default AboutFounder;
