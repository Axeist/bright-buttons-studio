import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Palette, Leaf, Hand, CheckCircle, Package } from "lucide-react";

const steps = [
  {
    icon: Palette,
    title: "Design & Customization",
    description: "Share your vision – we'll collaborate to create something perfect for you."
  },
  {
    icon: Leaf,
    title: "Material Selection",
    description: "We source the finest natural fabrics and gather fresh botanicals for printing."
  },
  {
    icon: Hand,
    title: "Handcrafting",
    description: "Each piece is carefully created using time-honored techniques and natural dyes."
  },
  {
    icon: CheckCircle,
    title: "Quality Check",
    description: "Every garment is inspected for perfection before it earns our signature."
  },
  {
    icon: Package,
    title: "Delivery",
    description: "Your unique piece is lovingly packaged and delivered to your doorstep."
  }
];

export const ProcessSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="process" className="section-padding bg-earth-50 dark:bg-card" ref={ref}>
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-script text-gradient mb-3 sm:mb-4">
            How We Create Magic
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From a spark of inspiration to a piece you'll live in – every step is infused with care.
          </p>
        </motion.div>

        {/* Desktop Timeline */}
        <div className="hidden md:block relative">
          {/* Connection Line */}
          <div className="absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-100 dark:from-primary-900/40 via-primary-300 dark:via-primary-700 to-primary-100 dark:to-primary-900/40" />
          
          <div className="grid grid-cols-5 gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step Number */}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                </div>

                {/* Content Card */}
                <div className="mt-8 glass-card p-5 w-full hover-lift">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mx-auto mb-3">
                    <step.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Steps */}
        <div className="md:hidden space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="glass-card p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <step.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
