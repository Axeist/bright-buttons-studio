import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.jpg";

interface LogoProps {
  className?: string;
  linkTo?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className = "", linkTo = "/", size = "md" }: LogoProps) => {
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14"
  };

  const content = (
    <img 
      src={logoImage} 
      alt="Bb's Bright Buttons" 
      className={`${sizes[size]} w-auto object-contain ${className}`}
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
