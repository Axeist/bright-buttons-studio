import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  message?: string;
  className?: string;
  variant?: "inline" | "ghost";
  children?: React.ReactNode;
}

const WHATSAPP_NUMBER = "919952655555";
const DEFAULT_MESSAGE = "Hi! I'm interested in Bright Buttons eco-friendly clothing";

export const WhatsAppButton = ({ 
  message = DEFAULT_MESSAGE, 
  className = "",
  variant = "inline",
  children 
}: WhatsAppButtonProps) => {
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, "_blank");
  };

  if (variant === "ghost") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 h-11 sm:h-9 px-3 sm:px-3 rounded-full text-sm font-medium text-foreground hover:text-primary transition-colors shadow-md hover:shadow-lg min-h-[44px] sm:min-h-[36px] ${className}`}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">{children || "Enquire on WhatsApp"}</span>
        <span className="sm:hidden">{children || "WhatsApp"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 h-12 sm:h-11 px-6 sm:px-8 bg-gradient-to-r from-[#25D366] to-[#20BD5A] text-white rounded-full font-semibold hover:from-[#20BD5A] hover:to-[#1DA851] transition-all duration-300 shadow-xl hover:shadow-2xl min-h-[48px] sm:min-h-[44px] ${className}`}
    >
      <MessageCircle className="w-5 h-5" />
      <span>{children || "Chat on WhatsApp"}</span>
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
