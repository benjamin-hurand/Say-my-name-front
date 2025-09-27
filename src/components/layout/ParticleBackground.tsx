// src/components/layout/ParticleBackground.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Particles from "@tsparticles/react";
import { initParticlesEngine } from "@tsparticles/react";
import type { ISourceOptions, Container } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";
import { useParticles } from "../../contexts/ParticlesContext";

const ParticlesBackground: React.FC = () => {
  const { color } = useThemeColorContext();
  const { enabled, count, speed, frozen } = useParticles();
  const [init, setInit] = useState(false);
  const containerRef = useRef<Container | null>(null);

  useEffect(() => {
    let mounted = true;
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      if (mounted) setInit(true);
    });
    return () => { mounted = false; };
  }, []);

  // Responsive
  const mobileCount = useMemo(() => Math.max(0, Math.round(count * 0.55)), [count]);

  // 👉 FIX: on fige via les options (move.enable = !frozen), sans pause impérative
  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: true, zIndex: 0 },
      pauseOnBlur: true,
      background: { color: { value: "transparent" } },
      detectRetina: false,

      particles: {
        number: {
          value: count,
          density: { enable: true, area: 800 }
        },
        color: { value: color },

        links: {
          enable: true,
          distance: 180,
          color: color,
          opacity: 0.2,
          width: 1
        },

        move: {
          enable: true,      // ← ICI: on coupe le mouvement si frozen
          speed: frozen ? 0 : speed,         // ← ta vitesse habituelle quand pas gelé
          direction: "none",
          outModes: { default: "bounce" }
        },

        size: { value: { min: 1, max: 7 } },
        opacity: { value: 0.3 }
      },

      responsive: [
        {
          maxWidth: 768,
          options: {
            particles: {
              number: { value: mobileCount }
            }
          }
        }
      ]
    }),
    [color, count, speed, mobileCount, frozen] // ← inclure frozen
  );

  if (!init || !enabled) return null;

  return (
    <Particles
      id="tsparticles"
      options={options}
      particlesLoaded={async (container) => {
        containerRef.current = container ?? null;
      }}
    />
  );
};

export default ParticlesBackground;
