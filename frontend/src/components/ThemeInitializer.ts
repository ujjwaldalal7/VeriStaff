import { useEffect } from "react";
import { useAppSelector } from "../hooks/redux";

export default function ThemeInitializer() {
  const theme = useAppSelector(
    (state) => state.theme.mode
  );

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle(
      "dark",
      theme === "dark"
    );
  }, [theme]);

  return null;
}