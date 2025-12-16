import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Facebook, Twitter, Linkedin, Mail, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { WhatsAppButton } from "@/components/WhatsAppButton";

interface ProductShareModalProps {
  productName: string;
  productUrl: string;
  productImage?: string;
  description?: string;
  trigger?: React.ReactNode;
}

export const ProductShareModal = ({
  productName,
  productUrl,
  productImage,
  description,
  trigger,
}: ProductShareModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    toast({
      title: "Link Copied",
      description: "Product link copied to clipboard",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: description || "",
          url: productUrl,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(productName)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareToLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out ${productName}`);
    const body = encodeURIComponent(`${description || productName}\n\n${productUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="rounded-full">
      <Share2 className="w-4 h-4 mr-2" />
      Share
    </Button>
  );

  const handleWhatsAppShare = () => {
    const message = `Check out ${productName} from Bright Buttons: ${productUrl}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=919952655555&text=${encodedMessage}`;
    
    // Close the dialog first
    setIsOpen(false);
    
    // Small delay to ensure dialog closes before opening WhatsApp
    setTimeout(() => {
      window.open(whatsappUrl, "_blank");
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Product
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 rounded-full"
              onClick={() => {
                handleCopyLink();
                setIsOpen(false);
              }}
            >
              <Copy className="w-5 h-5" />
              <span className="text-xs">Copy Link</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 rounded-full"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
              <span className="text-xs">Native Share</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 rounded-full"
              onClick={shareToFacebook}
            >
              <Facebook className="w-5 h-5 text-blue-600" />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 rounded-full"
              onClick={shareToTwitter}
            >
              <Twitter className="w-5 h-5 text-blue-400" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 rounded-full"
              onClick={shareToLinkedIn}
            >
              <Linkedin className="w-5 h-5 text-blue-700" />
              <span className="text-xs">LinkedIn</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 rounded-full"
              onClick={shareViaEmail}
            >
              <Mail className="w-5 h-5" />
              <span className="text-xs">Email</span>
            </Button>
          </div>
          <Button
            onClick={handleWhatsAppShare}
            className="w-full rounded-full bg-gradient-to-r from-[#25D366] to-[#20BD5A] text-white hover:from-[#20BD5A] hover:to-[#1DA851]"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Share on WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

