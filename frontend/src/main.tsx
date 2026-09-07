import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import App from "./App";
import { store } from "./app/store";
import BrandingInitializer from "./components/BrandingInitializer";
import ThemeInitializer from "./components/ThemeInitializer";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeInitializer />
      <BrandingInitializer />
      <App />
    </Provider>
  </StrictMode>
);
