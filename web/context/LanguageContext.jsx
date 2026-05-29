
import { createContext, useContext, useState, useEffect } from "react";
import { translations, getLang } from "../lib/i18n";

const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState("es");

  useEffect(() => {
    const saved = getLang();
    setLang(saved);
  }, []);

  const changeLang = (l) => {
    localStorage.setItem("lang", l);
    setLang(l);
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
