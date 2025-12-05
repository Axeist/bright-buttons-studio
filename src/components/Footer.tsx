import { Link } from "react-router-dom";
import { Instagram, MessageCircle, Mail } from "lucide-react";
import { Logo } from "./Logo";

const quickLinks = [
  { name: "Our Story", href: "/#story" },
  { name: "Collections", href: "/#collections" },
  { name: "Process", href: "/#process" },
  { name: "FAQ", href: "/#faq" },
  { name: "Custom Orders", href: "/#contact" },
  { name: "Meet the Founder", href: "/about-founder" },
  { name: "Contact", href: "/#contact" },
];

export const Footer = () => {
  return (
    <footer className="bg-earth-50 dark:bg-card border-t border-border">
      <div className="container-custom py-12 md:py-16">
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
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Connect With Us</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://wa.me/919952655555"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-[#25D366] transition-colors"
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
                  className="flex items-center gap-3 text-muted-foreground hover:text-[#E4405F] transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                  <span>BB's Bright Buttons</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@brightbuttons.com"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>hello@brightbuttons.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="mt-12 pt-6 border-t border-border/50">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Bb's Bright Buttons. Handcrafted with love 💚
          </p>
        </div>
      </div>
    </footer>
  );
};
