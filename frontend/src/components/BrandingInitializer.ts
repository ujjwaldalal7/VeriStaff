import { useEffect } from "react";
import { useAppSelector } from "../hooks/redux";

export default function BrandingInitializer() {
  const tenant = useAppSelector(
    (state) => state.tenant.current
  );

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty(
      "--tenant-primary-color",
      tenant?.primaryColor || "#1E40AF"
    );
    root.style.setProperty(
      "--tenant-secondary-color",
      tenant?.secondaryColor || "#3B82F6"
    );
  }, [tenant]);

  return null;
}
