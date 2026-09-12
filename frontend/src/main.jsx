import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// Initialize react-i18next BEFORE rendering — must be first
import "./i18n.config.js";
import { LanguageProvider } from "./LanguageContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);