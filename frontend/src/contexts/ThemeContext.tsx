import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("app-theme") as Theme) || "system";
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (themeToApply: Theme) => {
    const root = window.document.documentElement;
    const isDark =
      themeToApply === "dark" ||
      (themeToApply === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", isDark);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("app-theme", newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
