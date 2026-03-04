import React, { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";

type Props = {
  /**
   * Masque définissant la structure du texte à trous.
   * Convention: "_" ou "?" = trou (case éditable), autre caractère = fixe
   * Exemple: "J__n" => J visible, 2 cases éditables, n visible
   */
  mask: string;
  /** Valeur courante de l'utilisateur (même longueur que mask) */
  value: string;
  /** Callback: value mis à jour */
  onChange: (next: string) => void;
  /** Désactiver l'édition (mode résultat) */
  disabled?: boolean;
};

function isHoleChar(ch: string): boolean {
  return ch === "_" || ch === "?";
}

export const ClozeBoxes: React.FC<Props> = ({ mask, value, onChange, disabled }) => {
  const effectiveMask = useMemo(() => {
    if (!mask || mask.length === 0) {
      console.warn("[ClozeBoxes] Masque vide reçu");
      return "";
    }
    return mask;
  }, [mask]);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // assure value longueur = mask longueur
  const effectiveValue = useMemo(() => {
    const base = (value ?? "").padEnd(effectiveMask.length, " ").slice(0, effectiveMask.length);
    // recopie les chars fixes depuis mask si non-trou
    const arr = Array.from(base);
    for (let i = 0; i < effectiveMask.length; i++) {
      const m = effectiveMask[i];
      if (!isHoleChar(m)) {
        // caractère fixe : on le prend du mask
        arr[i] = m;
      }
      // si espace dans le mask : force espace
      if (m === " ") arr[i] = " ";
    }
    return arr.join("");
  }, [value, effectiveMask]);

  useEffect(() => {
    // focus premier trou au montage
    const firstHole = Array.from(effectiveMask).findIndex((m) => isHoleChar(m) && m !== " ");
    if (firstHole >= 0) inputsRef.current[firstHole]?.focus();
  }, [effectiveMask]);

  const setCharAt = (idx: number, ch: string) => {
    const arr = Array.from(effectiveValue);
    arr[idx] = ch;
    onChange(arr.join(""));
  };

  const focusNextHole = (from: number) => {
    for (let i = from + 1; i < effectiveMask.length; i++) {
      const m = effectiveMask[i];
      if (m === " ") continue;
      if (isHoleChar(m)) {
        inputsRef.current[i]?.focus();
        return;
      }
    }
  };

  const focusPrevHole = (from: number) => {
    for (let i = from - 1; i >= 0; i--) {
      const m = effectiveMask[i];
      if (m === " ") continue;
      if (isHoleChar(m)) {
        inputsRef.current[i]?.focus();
        return;
      }
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        mt: 2,
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {Array.from(effectiveMask).map((m, i) => {
        const isSpace = m === " ";
        const isHole = isHoleChar(m);
        const editable = !disabled && !isSpace && isHole;
        const displayed = isSpace
          ? ""
          : isHole
            ? (effectiveValue[i] === " " ? "" : effectiveValue[i])
            : m.toUpperCase();

        if (isSpace) {
          return <Box key={`sp-${i}`} sx={{ width: 14 }} />;
        }

        return (
          <Box
            key={`bx-${i}`}
            component="input"
            ref={(el: HTMLInputElement | null) => {
              inputsRef.current[i] = el;
            }}
            value={displayed}
            disabled={!editable}
            inputMode="text"
            maxLength={1}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const raw = e.target.value;
              const ch = raw ? raw[raw.length - 1] : "";
              if (!ch) {
                setCharAt(i, " ");
                return;
              }
              // Transformer en majuscule (noms propres)
              setCharAt(i, ch.toUpperCase());
              focusNextHole(i);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Backspace") {
                e.preventDefault();
                setCharAt(i, " ");
                focusPrevHole(i);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                focusPrevHole(i);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                focusNextHole(i);
              }
            }}
            sx={{
              width: 44,
              height: 52,
              borderRadius: 2,
              textAlign: "center",
              fontSize: 22,
              fontWeight: 800,
              outline: "none",
              border: "1px solid rgba(255,255,255,0.25)",
              backgroundColor: editable ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
              color: "common.white",
              boxShadow: editable ? 2 : 0,
              caretColor: "transparent",
              "&:focus": {
                borderColor: "rgba(255,255,255,0.55)",
                boxShadow: 4,
              },
            }}
          />
        );
      })}
    </Box>
  );
};
