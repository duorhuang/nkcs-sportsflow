"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SportChannel, UserSummary, PlayerProfileData } from "@/types";
import { Locale, translations } from "@/lib/i18n";
import { useRouter, usePathname } from "next/navigation";

export interface CurrentUser extends UserSummary {
  playerProfiles?: PlayerProfileData[];
  coachAssignments?: { sport: SportChannel }[];
}

interface AppContextType {
  sport: SportChannel;
  setSport: (sport: SportChannel) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof translations.zh) => string;
  user: CurrentUser | null;
  authLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Detect sport from pathname if on /[sport]/* route
  const getInitialSport = (): SportChannel => {
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/^\/(football|volleyball|basketball)/i);
      if (match) {
        return match[1].toUpperCase() as SportChannel;
      }
      const saved = localStorage.getItem("nkcs_sport");
      if (saved === "FOOTBALL" || saved === "VOLLEYBALL" || saved === "BASKETBALL") {
        return saved as SportChannel;
      }
    }
    return "FOOTBALL";
  };

  const [sport, setSportState] = useState<SportChannel>(getInitialSport);
  const [locale, setLocaleState] = useState<Locale>("zh");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Sync sport change
  const setSport = (newSport: SportChannel) => {
    setSportState(newSport);
    if (typeof window !== "undefined") {
      localStorage.setItem("nkcs_sport", newSport);
    }
    // If currently on a channel route, transition to the new sport's equivalent subroute
    const sportLower = newSport.toLowerCase();
    const currentSegments = pathname.split("/").filter(Boolean);
    if (
      currentSegments[0] === "football" ||
      currentSegments[0] === "volleyball" ||
      currentSegments[0] === "basketball"
    ) {
      const subRoute = currentSegments.slice(1).join("/");
      router.push(`/${sportLower}${subRoute ? `/${subRoute}` : ""}`);
    }
  };

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("nkcs_locale", newLocale);
    }
  };

  const t = (key: keyof typeof translations.zh): string => {
    return translations[locale][key] || key;
  };

  // Fetch current user from /api/auth/me
  const refreshUser = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLocale = localStorage.getItem("nkcs_locale");
      if (savedLocale === "en" || savedLocale === "zh") {
        setLocaleState(savedLocale);
      }
    }
    refreshUser();
  }, []);

  // Update sport state if URL changes directly
  useEffect(() => {
    const match = pathname.match(/^\/(football|volleyball|basketball)/i);
    if (match) {
      const matchedSport = match[1].toUpperCase() as SportChannel;
      if (matchedSport !== sport) {
        setSportState(matchedSport);
        localStorage.setItem("nkcs_sport", matchedSport);
      }
    }
  }, [pathname]);

  // Channel Selection: Set initial sport on login, but allow freedom to switch and inspect all 3 sports
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      // Default to user assigned sport on first load if on generic route
      if (pathname === "/") {
        let initialSport: SportChannel = "FOOTBALL";
        if (user.username === "volleyball") initialSport = "VOLLEYBALL";
        else if (user.username === "basketball") initialSport = "BASKETBALL";
        else if (user.username === "football") initialSport = "FOOTBALL";
        setSport(initialSport);
      }
    }
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        sport,
        setSport,
        locale,
        setLocale,
        t,
        user,
        authLoading,
        setUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
