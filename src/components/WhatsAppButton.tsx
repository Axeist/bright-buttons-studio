import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  message?: string;
  className?: string;
  variant?: "floating" | "inline" | "ghost";
  children?: React.ReactNode;
}

const WHATSAPP_NUMBER = "919952655555";
const DEFAULT_MESSAGE = "Hi! I'm interested in Bright Buttons eco-friendly clothing";

export const WhatsAppButton = ({ 
  message = DEFAULT_MESSAGE, 
  className = "",
  variant = "floating",
  children 
}: WhatsAppButtonProps) => {
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, "_blank");
  };

  if (variant === "floating") {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#25D366] to-[#20BD5A] text-white shadow-lg hover:shadow-2xl flex items-center justify-center group relative overflow-hidden ${className}`}
        aria-label="Chat on WhatsApp"
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-[#25D366]/30"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Sparkle effects */}
        <motion.div
          className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full"
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 0,
          }}
        />
        <motion.div
          className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full"
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full"
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 1,
          }}
        />

        {/* Ripple effect */}
        <motion.span
          className="absolute inset-0 rounded-full bg-white/30"
          initial={{ scale: 0, opacity: 0.5 }}
          whileTap={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />

        <MessageCircle className="w-7 h-7 md:w-8 md:h-8 relative z-10" />
        <span className="absolute right-full mr-3 px-3 py-2 bg-foreground text-background text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
          Chat with us
        </span>
      </motion.button>
    );
  }

  if (variant === "ghost") {
    return (
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`inline-flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary transition-all duration-300 relative overflow-hidden group ${className}`}
      >
        <motion.span
          className="absolute inset-0 bg-primary/10 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300"
        />
        <MessageCircle className="w-4 h-4 relative z-10" />
        <span className="relative z-10">{children || "Enquire on WhatsApp"}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#25D366] to-[#20BD5A] text-white rounded-full font-medium hover:from-[#20BD5A] hover:to-[#1DA851] transition-all duration-300 shadow-md hover:shadow-xl relative overflow-hidden group ${className}`}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Sparkle effects on hover */}
      <motion.div
        className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100"
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 0,
        }}
      />
      <motion.div
        className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100"
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 0.5,
        }}
      />

      {/* Ripple effect */}
      <motion.span
        className="absolute inset-0 rounded-full bg-white/30"
        initial={{ scale: 0, opacity: 0.5 }}
        whileTap={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.4 }}
      />

      <MessageCircle className="w-5 h-5 relative z-10" />
      <span className="relative z-10">{children || "Chat on WhatsApp"}</span>
    </motion.button>
  );
};

export const getWhatsAppLink = (productName?: string, category?: string, fabric?: string) => {
  let message = DEFAULT_MESSAGE;
  if (productName) {
    message = `Hi! I'm interested in ${productName}${category ? ` (${category}` : ''}${fabric ? `, ${fabric})` : category ? ')' : ''} from Bright Buttons. Can you share details and pricing?`;
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
