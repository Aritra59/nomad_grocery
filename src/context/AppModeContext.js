import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearDemoDomainData } from "../utils/scopedStorage";

const AppModeContext = createContext(null);

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
}

export function AppModeProvider({ mode, sheetData, children }) {
  // mode comes from App.jsx: "explore" (demo) or "live"
  const isDemoMode = mode !== "live";
  const shopId = sheetData?.shopId || sheetData?.sheetCode || sheetData?.mobile || null;

  // Persist mode flag (optional; mainly for observability)
  useEffect(() => {
    try {
      localStorage.setItem("nomad_app_mode_v1", isDemoMode ? "demo" : "live");
    } catch {
      // ignore
    }
  }, [isDemoMode]);

  // Reset demo data on restart and when entering demo.
  useEffect(() => {
    if (isDemoMode) clearDemoDomainData();
  }, [isDemoMode]);

  const value = useMemo(() => ({ mode, isDemoMode, shopId }), [mode, isDemoMode, shopId]);

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

