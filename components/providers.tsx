"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { StandupStoreProvider } from "./store";

type Theme = "dark" | "light";

function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function PageMotion() {
  const pathname = usePathname();
  const initialPathname = useRef(pathname);

  useEffect(() => {
    if (initialPathname.current !== pathname) {
      initialPathname.current = pathname;
      document.documentElement.dataset.pageIntro = "short";
    }
  }, [pathname]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  const toggleTheme = () => {
    const next = getThemeSnapshot() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("standupflow_theme", next);
    } catch (error) {
      console.error("Could not save the theme preference:", error);
    }
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <SessionProvider>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <StandupStoreProvider>
          <PageMotion />
          {children}
        </StandupStoreProvider>
      </ThemeContext.Provider>
    </SessionProvider>
  );
}
