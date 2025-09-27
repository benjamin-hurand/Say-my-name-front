import React, { createContext, useContext, useEffect, useState } from "react";

export interface ParticlesSettings {
  enabled: boolean;
  count: number;   // 0–200 recommandé
  speed: number;   // 0–5 recommandé
  frozen: boolean; // true => stop mouvement

  setEnabled: (v: boolean) => void;
  setCount: (v: number) => void;
  setSpeed: (v: number) => void;
  setFrozen: (v: boolean) => void;
}

const ParticlesContext = createContext<ParticlesSettings | undefined>(undefined);

export const useParticles = (): ParticlesSettings => {
  const ctx = useContext(ParticlesContext);
  if (!ctx) {
    throw new Error("useParticles must be used within a ParticlesProvider");
  }
  return ctx;
};

export const ParticlesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem("particlesEnabled");
    return v === null ? true : v === "true";
  });

  const [count, setCount] = useState<number>(() => {
    const v = Number(localStorage.getItem("particlesCount"));
    return Number.isFinite(v) ? v : 80;
  });

  const [speed, setSpeed] = useState<number>(() => {
    const v = Number(localStorage.getItem("particlesSpeed"));
    return Number.isFinite(v) ? v : 1.0;
  });

  const [frozen, setFrozen] = useState<boolean>(() => {
    const v = localStorage.getItem("particlesFrozen");
    return v === "true";
  });

  // Persistance locale
  useEffect(() => { localStorage.setItem("particlesEnabled", String(enabled)); }, [enabled]);
  useEffect(() => { localStorage.setItem("particlesCount", String(count)); }, [count]);
  useEffect(() => { localStorage.setItem("particlesSpeed", String(speed)); }, [speed]);
  useEffect(() => { localStorage.setItem("particlesFrozen", String(frozen)); }, [frozen]);

  const value: ParticlesSettings = {
    enabled, count, speed, frozen,
    setEnabled, setCount, setSpeed, setFrozen,
  };

  return <ParticlesContext.Provider value={value}>{children}</ParticlesContext.Provider>;
};
