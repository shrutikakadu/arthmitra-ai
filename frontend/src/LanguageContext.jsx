import { createContext, useContext, useState, useCallback, useMemo } from "react";
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

  const getTranslation = useCallback(
    (key) => {
      if (!key) return "";
      return translations[lang]?.[key] || translations["en"]?.[key] || key;
    },
    [lang]
  );

  const t = useMemo(() => {
    const fn = (key) => getTranslation(key);
    return new Proxy(fn, {
      get: (target, prop) => {
        if (typeof prop === "symbol" || prop in target || prop === "then") {
          return target[prop];
        }
        return getTranslation(prop);
      }
    });
  }, [getTranslation]);

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
