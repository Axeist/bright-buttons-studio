import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Instagram, MessageCircle, Mail, LogIn } from "lucide-react";
import { Logo } from "./Logo";
import { CuephoriaBranding } from "./CuephoriaBranding";

const quickLinks = [
  { name: "Our Story", href: "/#story" },
  { name: "Collections", href: "/#collections" },
  { name: "Process", href: "/#process" },
  { name: "FAQ", href: "/#faq" },
  { name: "Custom Orders", href: "/#contact" },
  { name: "Meet the Founder", href: "/#founder" },
  { name: "Contact", href: "/#contact" },
];

export const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const sectionId = href.replace("/#", "");
      
      if (location.pathname === "/") {
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        }, 100);
      } else {
        navigate("/");
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        }, 300);
      }
    }
  };

  return (
    <footer className="bg-earth-50 dark:bg-card border-t border-border">
      <div className="container-custom py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Logo size="xl" linkTo="/" />
            <p className="text-muted-foreground max-w-xs">
              Unique, eco-printed clothing crafted with love. Each piece is handmade using natural dyes and sustainable techniques, making every garment one-of-a-kind.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-0">
              {quickLinks.map((link, index) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1, type: "tween" }}
                  style={{ willChange: "transform, opacity" }}
                >
                  <motion.a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-muted-foreground hover:text-primary transition-colors inline-block relative group py-0.5 touch-target"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"
                    />
                    <span className="relative">{link.name}</span>
                  </motion.a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Connect With Us</h3>
            <ul className="space-y-0">
              <li>
                <a
                  href="https://wa.me/919952655555"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-[#25D366] transition-colors py-0.5 touch-target"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>+91 99526 55555</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/brightbuttons"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-[#E4405F] transition-colors py-0.5 touch-target"
                >
                  <Instagram className="w-5 h-5" />
                  <span>Bright Buttons</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@brightbuttons.com"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors py-0.5 touch-target"
                >
                  <Mail className="w-5 h-5" />
                  <span className="break-all">hello@brightbuttons.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex flex-col gap-4">
            {/* Policy Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <Link
                to="/terms-conditions"
                className="hover:text-primary transition-colors"
              >
                Terms & Conditions
              </Link>
              <span>•</span>
              <Link
                to="/privacy-policy"
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <span>•</span>
              <Link
                to="/refund-policy"
                className="hover:text-primary transition-colors"
              >
                Refund Policy
              </Link>
              <span>•</span>
              <Link
                to="/shipping-policy"
                className="hover:text-primary transition-colors"
              >
                Shipping Policy
              </Link>
            </div>
            
            {/* Copyright and Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="text-center md:text-left text-sm text-muted-foreground">
                © 2025 Bright Buttons. Handcrafted with love 💚
              </p>
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  title="Staff Login"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Staff Login</span>
                </Link>
                <CuephoriaBranding variant="footer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
