import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MessageCircle, Instagram, Mail, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const productTypes = [
  "Saree",
  "Kurtha & Co-ords",
  "Shawl",
  "Men's Shirt",
  "T-Shirt",
  "Kidswear",
  "Custom Design",
  "Other"
];

export const ContactSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    productType: "",
    occasion: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast({
        title: "Please fill required fields",
        description: "Name and WhatsApp number are required.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitted(true);
    toast({
      title: "Thank you!",
      description: "We'll get back to you on WhatsApp soon.",
    });
  };

  return (
    <section id="contact" className="section-padding bg-background" ref={ref}>
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-script text-gradient mb-4">
            Let's Create Something Beautiful
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            For custom orders, party wear, couple outfits, group tees, and more – we'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left - Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Get in Touch</h3>
              <p className="text-muted-foreground mb-6">
                The fastest way to reach us is through WhatsApp. We typically respond within a few hours and love discussing custom ideas!
              </p>
            </div>

            <div className="space-y-4">
              <a
                href="https://wa.me/919952655555"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 glass-card hover-lift"
              >
                <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#25D366]" />
                </div>
                <div>
                  <p className="font-medium text-foreground">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">+91 99526 55555</p>
                </div>
              </a>

              <a
                href="https://instagram.com/brightbuttons"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 glass-card hover-lift"
              >
                <div className="w-12 h-12 rounded-full bg-[#E4405F]/10 flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-[#E4405F]" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Instagram</p>
                  <p className="text-sm text-muted-foreground">Bright Buttons</p>
                </div>
              </a>

              <a
                href="mailto:hello@brightbuttons.com"
                className="flex items-center gap-4 p-4 glass-card hover-lift"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">hello@brightbuttons.com</p>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Right - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {isSubmitted ? (
              <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Thank You!</h3>
                <p className="text-muted-foreground mb-6">
                  We've received your enquiry and will get back to you on WhatsApp soon.
                </p>
                <Button onClick={() => setIsSubmitted(false)} variant="outline" className="rounded-full">
                  Send Another Enquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 space-y-5">
                <h3 className="text-xl font-semibold text-foreground mb-2">Custom Enquiry</h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      WhatsApp Number <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 99999 99999"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      What are you looking for?
                    </label>
                    <Select
                      value={formData.productType}
                      onValueChange={(value) => setFormData({ ...formData, productType: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {productTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Occasion (optional)
                    </label>
                    <Input
                      value={formData.occasion}
                      onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                      placeholder="Wedding, casual, etc."
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Tell us about your idea
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your vision, preferred colors, fabric, or any special requirements..."
                    rows={4}
                    className="rounded-xl resize-none"
                  />
                </div>

                <Button type="submit" className="w-full rounded-full" size="lg">
                  <Send className="w-4 h-4 mr-2" />
                  Send Enquiry
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
