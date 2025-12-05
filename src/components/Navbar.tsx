import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LogIn } from "lucide-react";
import { Logo } from "./Logo";
import { WhatsAppButton } from "./WhatsAppButton";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";

const navLinks = [
  { name: "Home", href: "/#hero" },
  { name: "Collections", href: "/#collections" },
  { name: "Our Story", href: "/#story" },
  { name: "Process", href: "/#process" },
  { name: "Testimonials", href: "/#testimonials" },
  { name: "FAQ", href: "/#faq" },
  { name: "Contact", href: "/#contact" },
  { name: "Meet Subhiksha", href: "/#founder" },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    // Throttle scroll events for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", throttledScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [handleScroll]);

  // Handle hash navigation on page load
  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      const sectionId = location.hash.replace("#", "");
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
  }, [location]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    
    if (href.startsWith("/#")) {
      const sectionId = href.replace("/#", "");
      
      // If we're on the home page, scroll directly
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
        // Navigate to home page first, then scroll
        window.location.href = href;
      }
    } else {
      // Regular navigation
      navigate(href);
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-background/95 backdrop-blur-xl shadow-md border-b border-border/50" 
            : "bg-background/80 backdrop-blur-sm"
        }`}
      >
        <nav className="container-custom">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <Logo size="2xl" linkTo={undefined} />
            </Link>

            {/* Desktop Actions - Right Side */}
            <div className="hidden lg:flex items-center gap-4">
              <ThemeToggle />
              <WhatsAppButton variant="ghost" />
              <Button 
                size="sm" 
                className="rounded-full"
                onClick={() => handleNavClick("/#collections")}
              >
                Shop Now
              </Button>
              <Link
                to="/login"
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                title="Staff Login"
                aria-label="Staff Login"
              >
                <LogIn className="w-4 h-4" />
              </Link>
              
              {/* Desktop Menu Toggle */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  aria-label="Toggle menu"
                >
                  <span>Menu</span>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isMenuOpen ? "rotate-180" : ""
                    }`} 
                  />
                </button>

                {/* Desktop Dropdown Menu */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-xl overflow-hidden"
                    >
                      <div className="py-2">
                        {navLinks.map((link, index) => (
                          <motion.a
                            key={link.name}
                            href={link.href}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavClick(link.href);
                            }}
                            className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-primary transition-colors cursor-pointer relative overflow-hidden group"
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <motion.span
                              className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100"
                              initial={{ scaleY: 0 }}
                              whileHover={{ scaleY: 1 }}
                              transition={{ duration: 0.2 }}
                            />
                            <span className="relative z-10">{link.name}</span>
                          </motion.a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 sm:gap-3 lg:hidden">
              <ThemeToggle />
              <WhatsAppButton variant="ghost" />
              <Link
                to="/login"
                className="p-2 text-muted-foreground hover:text-primary transition-colors touch-target"
                title="Staff Login"
                aria-label="Staff Login"
              >
                <LogIn className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2.5 sm:p-2 text-foreground hover:text-primary transition-colors touch-target"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile/Tablet Expandable Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden lg:hidden border-t border-border/50"
            >
              <div className="container-custom py-4 space-y-1">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href);
                    }}
                    className="block px-4 py-3.5 sm:py-3 text-base font-medium text-foreground hover:bg-accent hover:text-primary rounded-lg transition-colors cursor-pointer relative overflow-hidden group touch-target"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <motion.span
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 rounded-l-lg"
                      initial={{ scaleY: 0 }}
                      whileHover={{ scaleY: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <span className="relative z-10">{link.name}</span>
                  </motion.a>
                ))}
                <div className="pt-4 mt-4 border-t border-border/50">
                  <Button 
                    className="w-full rounded-full"
                    onClick={() => handleNavClick("/#collections")}
                  >
                    Shop Now
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
};
