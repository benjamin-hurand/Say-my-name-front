// src/hooks/usePreviousRoute.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const CUR_KEY = "app_current_path";
const PREV_KEY = "app_previous_path";

export function useRouteHistoryTracker() {
  const location = useLocation();
  useEffect(() => {
    const cur = `${location.pathname}${location.search}${location.hash}`;
    const prev = sessionStorage.getItem(CUR_KEY);
    if (prev) sessionStorage.setItem(PREV_KEY, prev);
    sessionStorage.setItem(CUR_KEY, cur);
  }, [location]);
}

export function getPreviousRoute(): string | null {
  return sessionStorage.getItem(PREV_KEY);
}
