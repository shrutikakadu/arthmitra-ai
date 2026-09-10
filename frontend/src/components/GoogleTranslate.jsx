import { useEffect } from "react";

export default function GoogleTranslate() {
    useEffect(() => {
        window.googleTranslateElementInit = () => {
            if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: "en",
                        includedLanguages: "en,hi,mr",
                        autoDisplay: false,
                    },
                    "google_translate_element"
                );
            }
        };

        const script = document.createElement("script");
        script.src =
            "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;

        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return (
        <div
            id="google_translate_element"
            style={{
                position: "fixed",
                top: "10px",
                right: "10px",
                zIndex: 9999,
            }}
        />
    );
}