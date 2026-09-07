import { Link } from "react-router-dom";

interface LogoProps {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
  linkTo?: string;
  logoUrl?: string | null;
  name?: string;
}

export default function Logo({
  variant = "full",
  size = "md",
  linkTo = "/dashboard",
  logoUrl,
  name = "VeriStaff"
}: LogoProps) {
  const logoSrc =
    logoUrl ||
    (variant === "full"
      ? "/veristaff.png"
      : "/veristaff-logo.png");

  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16"
  };

  const logo = logoUrl ? (
    <div className="inline-flex items-center gap-3">
      <img
        src={logoSrc}
        alt={name}
        className={`${sizeClasses[size]} max-w-40 object-contain`}
      />

      {variant === "full" && (
        <span className="max-w-40 truncate text-sm font-semibold text-slate-900 dark:text-white">
          {name}
        </span>
      )}
    </div>
  ) : (
    <img
      src={logoSrc}
      alt={name}
      className={`${sizeClasses[size]} w-auto object-contain`}
    />
  );

  if (!linkTo) {
    return logo;
  }

  return (
    <Link
      to={linkTo}
      aria-label={name}
      className="inline-flex items-center"
    >
      {logo}
    </Link>
  );
}
