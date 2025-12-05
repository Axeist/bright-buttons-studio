import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.jpg";

interface LogoProps {
  className?: string;
  linkTo?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Logo = ({ className = "", linkTo = "/", size = "md" }: LogoProps) => {
  const sizes = {
    sm: "h-10",
    md: "h-16",
    lg: "h-20",
    xl: "h-24"
  };

  const content = (
    <img 
      src={logoImage} 
      alt="Bb's Bright Buttons" 
      className={`${sizes[size]} w-auto object-contain dark:brightness-110 dark:contrast-110 ${className}`}
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
};
