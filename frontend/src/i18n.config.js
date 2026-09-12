// ArthMitra AI — react-i18next Configuration
// Initializes i18next with the existing modular translation dictionaries.
// Language is persisted in localStorage under "arthmitra_lang".

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./i18n/en";
import hi from "./i18n/hi";
import mr from "./i18n/mr";

const savedLang = localStorage.getItem("arthmitra_lang") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
    },
    lng: savedLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    react: {
      useSuspense: false, // Disable suspense — works without React.Suspense wrapper
    },
  });

export default i18n;
