import { memo } from "react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.jpg";

interface LogoProps {
  className?: string;
  linkTo?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

export const Logo = memo(({ className = "", linkTo = "/", size = "md" }: LogoProps) => {
  const sizes = {
    sm: "h-10",
    md: "h-16",
    lg: "h-20",
    xl: "h-24",
    "2xl": "h-28",
    "3xl": "h-32"
  };

  const content = (
    <img 
      src={logoImage} 
      alt="Bright Buttons" 
      loading="eager"
      fetchPriority="high"
      className={`${sizes[size]} w-auto object-contain dark:brightness-110 dark:contrast-110 ${className}`}
      style={{ willChange: "opacity" }}
    />
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
});

Logo.displayName = "Logo";
