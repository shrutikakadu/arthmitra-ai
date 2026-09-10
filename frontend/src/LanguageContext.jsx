import { createContext, useContext, useState, useCallback } from "react";
import translations from "./i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem("arthmitra_lang") || "en";
  });

  const setLang = useCallback((newLang) => {
    localStorage.setItem("arthmitra_lang", newLang);
    setLangState(newLang);
  }, []);

  const t = useCallback(
    (key) => translations[lang]?.[key] || translations["en"]?.[key] || key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
