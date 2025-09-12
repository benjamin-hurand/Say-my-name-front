import React, { useEffect, useMemo, useState } from "react";
import Particles from "@tsparticles/react";
import { initParticlesEngine } from "@tsparticles/react";
import { ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { useThemeColorContext } from "../../contexts/ThemeColorContext";

const ParticlesBackground: React.FC = () => {
  const { color } = useThemeColorContext();
  const [init, setInit] = useState(false);

  // Initialise le moteur une seule fois AVANT de rendre <Particles />
  useEffect(() => {
    let mounted = true;
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      if (mounted) setInit(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      // Laisse tsParticles occuper tout l'écran proprement, sous le contenu
      fullScreen: { enable: true, zIndex: 0 },

      pauseOnBlur: true,
      background: {
        color: { value: "transparent" }
      },
      detectRetina: false,

      particles: {
        number: {
          value: 180,
          density: {
            enable: true,
            area: 800 // zone de densité "classique"
          }
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
          enable: true,
          speed: 1,
          // v3: utiliser 'none' string ou enum, les deux passent
          direction: "none",
          // v3: outModes (et plus outMode)
          outModes: { default: "bounce" }
        },

        size: { value: { min: 1, max: 7 } },
        opacity: { value: 0.3 }
      },

      // Bonus: limite le nombre sur petits écrans
      responsive: [
        {
          maxWidth: 768,
          options: {
            particles: {
              number: { value: 100 }
            }
          }
        }
      ]
    }),
    [color]
  );

  if (!init) return null; // attend l'init moteur pour éviter l'écran blanc silencieux
  return <Particles id="tsparticles" options={options} />;
};

export default ParticlesBackground;
