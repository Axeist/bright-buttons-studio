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
        className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl flex items-center justify-center group ${className}`}
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 md:w-8 md:h-8" />
        <span className="absolute right-full mr-3 px-3 py-2 bg-foreground text-background text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Chat with us
        </span>
      </motion.button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary transition-colors ${className}`}
      >
        <MessageCircle className="w-4 h-4" />
        {children || "Enquire on WhatsApp"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-medium hover:bg-[#20BD5A] transition-colors shadow-md hover:shadow-lg ${className}`}
    >
      <MessageCircle className="w-5 h-5" />
      {children || "Chat on WhatsApp"}
    </button>
  );
};

export const getWhatsAppLink = (productName?: string, category?: string, fabric?: string) => {
  let message = DEFAULT_MESSAGE;
  if (productName) {
    message = `Hi! I'm interested in ${productName}${category ? ` (${category}` : ''}${fabric ? `, ${fabric})` : category ? ')' : ''} from Bright Buttons. Can you share details and pricing?`;
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
