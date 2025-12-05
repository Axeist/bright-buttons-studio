import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Leaf, Fingerprint, Palette, Sparkles } from "lucide-react";

const valueProps = [
  {
    icon: Fingerprint,
    title: "Truly One-of-a-Kind",
    description: "No two pieces are ever identical – each carries nature's unique signature."
  },
  {
    icon: Palette,
    title: "Personalized Designs",
    description: "Custom creations tailored to your style, occasion, and preferences."
  },
  {
    icon: Leaf,
    title: "Nature-Friendly Fashion",
    description: "Sustainable practices and natural dyes that respect our planet."
  }
];

export const StorySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="story" className="section-padding gradient-earth" ref={ref}>
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-script text-gradient">
              Our Story
            </h2>
            
            <p className="text-muted-foreground leading-relaxed">
              Every garment at Bright Buttons begins with a vision – to create wearable art that celebrates 
              individuality and respects nature. We believe that clothing should tell a story, and each of 
              our pieces carries the whispers of leaves, the dance of natural dyes, and the warmth of 
              handcrafted care.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              Our philosophy is simple: good materials, minimal waste, slow work, and supporting skilled 
              makers. We source the finest natural fabrics, work with artisans who've honed their craft 
              over generations, and take the time to create pieces meant to last a lifetime.
            </p>

            <blockquote className="border-l-4 border-primary pl-4 italic text-foreground">
              "We don't just make clothes – we create memories woven into fabric, 
              stories printed by nature itself."
            </blockquote>

            {/* Eco-Print Explainer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-card p-6 mt-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What is Eco Printing?</h3>
                  <p className="text-sm text-muted-foreground">
                    Eco printing is a magical process where real leaves and flowers are bundled with 
                    fabric and steamed. Natural tannins and pigments transfer onto the cloth, creating 
                    permanent, one-of-a-kind botanical prints. No two prints are ever the same – just 
                    like nature intended.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right - Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {[1, 2, 3, 4].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className={`${index === 0 || index === 3 ? 'aspect-[4/5]' : 'aspect-square'} 
                  bg-gradient-to-br from-primary-100 to-earth-100 rounded-2xl overflow-hidden shadow-lg
                  flex items-center justify-center`}
              >
                <div className="text-center p-4">
                  <Leaf className={`w-8 h-8 mx-auto mb-2 ${
                    index === 0 ? 'text-primary-500' : 
                    index === 1 ? 'text-earth-500' : 
                    index === 2 ? 'text-primary-600' : 'text-earth-600'
                  }`} />
                  <p className="text-xs text-muted-foreground">
                    {index === 0 ? 'Leaf Selection' : 
                     index === 1 ? 'Bundling Process' : 
                     index === 2 ? 'Natural Dyes' : 'Final Reveal'}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mt-16"
        >
          {valueProps.map((prop, index) => (
            <motion.div
              key={prop.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              className="glass-card p-6 hover-lift"
            >
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <prop.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{prop.title}</h3>
              <p className="text-sm text-muted-foreground">{prop.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
