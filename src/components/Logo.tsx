import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  linkTo?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className = "", linkTo = "/", size = "md" }: LogoProps) => {
  const sizes = {
    sm: { sub: "text-xs", main: "text-lg" },
    md: { sub: "text-xs", main: "text-xl" },
    lg: { sub: "text-sm", main: "text-2xl" }
  };

  const content = (
    <div className={`flex flex-col leading-tight ${className}`}>
      <span className={`${sizes[size].sub} text-muted-foreground font-medium tracking-wide`}>
        Bb's
      </span>
      <span className={`${sizes[size].main} font-script text-gradient`}>
        Bright Buttons
      </span>
    </div>
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
