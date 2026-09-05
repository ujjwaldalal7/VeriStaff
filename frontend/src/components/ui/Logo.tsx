import { Link } from "react-router-dom";

interface LogoProps {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
  linkTo?: string;
}

export default function Logo({
  variant = "full",
  size = "md",
  linkTo = "/dashboard"
}: LogoProps) {
  const logoSrc =
    variant === "full"
      ? "/veristaff.png"
      : "/veristaff-logo.png";

  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16"
  };

  const logo = (
    <img
      src={logoSrc}
      alt="VeriStaff"
      className={`${sizeClasses[size]} w-auto object-contain`}
    />
  );

  if (!linkTo) {
    return logo;
  }

  return (
    <Link
      to={linkTo}
      aria-label="VeriStaff"
      className="inline-flex items-center"
    >
      {logo}
    </Link>
  );
}