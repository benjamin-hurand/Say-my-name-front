import React, { useEffect, useRef, useState } from "react";
import { Avatar, Box, Stack } from "@mui/material";
import PhotoCameraFrontOutlinedIcon from "@mui/icons-material/PhotoCameraFrontOutlined";

type Props = {
  src?: string;
  alt?: string;
  initials: string;
  maxVh?: number;
  minShortEdge?: number;
  maxUpscale?: number;
  maxHeightPx?: number;
};

export default function PhotoResponsive({
  src,
  alt,
  initials,
  maxVh = 62,
  minShortEdge = 320,
  maxUpscale = 2.0,
  maxHeightPx,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerW, setContainerW] = useState<number>(0);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      setContainerW(containerRef.current.getBoundingClientRect().width);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!natural || !containerW) return;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const maxHFromVh = (maxVh / 100) * vh;
    const maxH = maxHeightPx ? Math.min(maxHFromVh, maxHeightPx) : maxHFromVh;

    const { w: nw, h: nh } = natural;
    const sMaxSpace   = Math.min(containerW / nw, maxH / nh);
    const sMinWanted  = Math.max(1, minShortEdge / Math.min(nw, nh));
    const s           = Math.min(sMaxSpace, maxUpscale, Math.max(1, sMinWanted));

    setSize({ w: Math.round(nw * s), h: Math.round(nh * s) });
  }, [natural, containerW, maxVh, minShortEdge, maxUpscale, maxHeightPx]);

  const resolvedMaxHeight =
    maxHeightPx != null
      ? `${maxHeightPx}px`
      : `${maxVh}vh`;

  return (
    <Box ref={containerRef} sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "transparent" }}>
      {src ? (
        <Box
          component="img"
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
            const img = e.currentTarget;
            setNatural({ w: img.naturalWidth, h: img.naturalHeight });
          }}
          sx={{
            width: size?.w ?? "auto",
            height: size?.h ?? "auto",
            maxWidth: "100%",
            maxHeight: resolvedMaxHeight,
            display: "block",
            borderRadius: 2,
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            background: "transparent",
            imageRendering: "auto",
          }}
        />
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            width: "100%",
            height: maxHeightPx ? `${maxHeightPx}px` : `min(${maxVh}vh, 420px)`,
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            background: "transparent",
            position: "relative",
          }}
        >
          <Avatar sx={{ width: 96, height: 96, fontSize: 32 }}>{initials || "?"}</Avatar>
          <PhotoCameraFrontOutlinedIcon
            sx={{
              position: "absolute",
              right: 8,
              bottom: 8,
              opacity: 0.9,
              bgcolor: "background.paper",
              borderRadius: "50%",
              fontSize: 18,
              p: 0.5,
              boxShadow: 1,
            }}
          />
        </Stack>
      )}
    </Box>
  );
}
