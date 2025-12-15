import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles } from "lucide-react";

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
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-script text-gradient">
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
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
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
            {[
              { 
                image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=750&fit=crop&auto=format&q=80",
                label: "Leaf Selection",
                aspect: "aspect-[4/5]"
              },
              { 
                image: "https://images.unsplash.com/photo-1601925260368-ae2f83d8a24d?w=600&h=600&fit=crop&auto=format&q=80",
                label: "Bundling Process",
                aspect: "aspect-square"
              },
              { 
                image: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=600&fit=crop&auto=format&q=80",
                label: "Natural Dyes",
                aspect: "aspect-square"
              },
              { 
                image: "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=750&fit=crop&auto=format&q=80",
                label: "Final Reveal",
                aspect: "aspect-[4/5]"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className={`${item.aspect} rounded-2xl overflow-hidden shadow-lg relative group`}
              >
                <img 
                  src={item.image} 
                  alt={item.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=600&fit=crop&auto=format&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
