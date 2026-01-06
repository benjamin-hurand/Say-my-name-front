import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { useNavigate } from "react-router-dom";

import { useProfile } from "../../contexts/ProfileContext";
import {
  getMyXpHistory,
  getMyXpHistoryNext,
  XpEventDto,
  XpHistoryResponseDto,
} from "../../services/business/leaderboard/leaderboard.service";

function safeNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function computeLevel(xpTotal: number) {
  const safeXp = Math.max(0, Number.isFinite(xpTotal) ? xpTotal : 0);
  const thresholdForLevel = (lvl: number) => 200 + 50 * Math.max(0, lvl - 1);

  let lvl = 1;
  let acc = 0;
  while (safeXp >= acc + thresholdForLevel(lvl)) {
    acc += thresholdForLevel(lvl);
    lvl++;
    if (lvl > 5000) break;
  }

  const start = acc;
  const end = acc + thresholdForLevel(lvl);
  const into = safeXp - start;
  const span = Math.max(1, end - start);

  return {
    level: lvl,
    levelStartXp: start,
    levelEndXp: end,
    xpIntoLevel: into,
    xpToNext: Math.max(0, end - safeXp),
    progress01: Math.min(1, into / span),
  };
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function dayKey(iso?: string | null) {
  if (!iso) return "unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatDayLabel(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getXpDelta(ev: any): number {
  const v = ev?.deltaXp ?? ev?.xp ?? ev?.delta_xp;
  if (typeof v === "number") return v;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : 0;
}

function shortEventLabel(eventKey?: string | null) {
  const k = (eventKey ?? "").trim();
  if (!k) return "Gain d’XP";
  if (k === "KNOWLEDGE_ANSWER_BATCH") return "Réponses (batch)";
  if (k.startsWith("KNOWLEDGE_STREAK_MILESTONE_")) return "Palier de streak";
  if (k.includes("STREAK")) return "Streak";
  if (k.includes("CORRECT")) return "Bonne réponse";
  if (k.includes("WRONG")) return "Mauvaise réponse";
  if (k.includes("BONUS")) return "Bonus";
  return k
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function eventIcon(eventKey?: string | null) {
  const k = (eventKey ?? "").toUpperCase();
  if (k.includes("STREAK")) return <LocalFireDepartmentRoundedIcon />;
  if (k.includes("CORRECT")) return <CheckCircleRoundedIcon />;
  if (k.includes("WRONG")) return <CancelRoundedIcon />;
  if (k.includes("BONUS")) return <AutoAwesomeRoundedIcon />;
  return <TrendingUpRoundedIcon />;
}

const XpHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { xp, rank, lastXpEventAt } = useProfile();

  const xpTotal = useMemo(() => Math.max(0, safeNumber(xp, 0)), [xp]);
  const levelInfo = useMemo(() => computeLevel(xpTotal), [xpTotal]);

  const [history, setHistory] = useState<XpHistoryResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const events = history?.events ?? [];
  const canLoadMore = Boolean(history?.nextBefore && history?.nextBeforeId != null);

  const groupedHistory = useMemo(() => {
    const map = new Map<string, XpEventDto[]>();
    for (const ev of events) {
      const k = dayKey(ev.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
    }
    return Array.from(map.entries()).map(([k, evs]) => ({
      day: k,
      label: formatDayLabel(evs[0]?.createdAt),
      events: evs,
    }));
  }, [events]);

  const loadFirst = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyXpHistory({ limit: 20 });
      setHistory(res);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger tes gains d’XP.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!history || loadingMore || !canLoadMore) return;
    try {
      setLoadingMore(true);
      setError(null);
      const next = await getMyXpHistoryNext(history, 30);
      setHistory((prev) => {
        if (!prev) return next;
        return { ...next, events: [...prev.events, ...next.events] };
      });
    } catch (e) {
      console.error(e);
      setError("Impossible de charger la page suivante.");
    } finally {
      setLoadingMore(false);
    }
  }, [history, loadingMore, canLoadMore]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  const rankLabel = rank ? `Rang #${rank}` : "Non classé";

  return (
    <Container
      maxWidth="sm"
      sx={{
        // IMPORTANT: pour rester cohérent avec les autres pages "hub"
        py: 2,
        // si ton layout parent est en flex column avec un content area scrollable,
        // minHeight: 0 évite les débordements bizarres.
        minHeight: 0,
      }}
    >
      <Box sx={{ pb: 4 }}>
        <Stack spacing={2.25}>
          {/* Title */}
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 20, lineHeight: 1.1 }}>
              XP & progression
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
              Suis ta progression et comprends ce qui te fait gagner de l’expérience.
            </Typography>
          </Box>

          {/* XP Summary */}
          <Card
            variant="outlined"
            sx={{
              backdropFilter: "blur(12px)",
              bgcolor: "rgba(32,32,32,0.7)",
            }}
          >
            <CardContent>
              <Stack spacing={1.25}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "stretch", sm: "flex-start" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, lineHeight: 1.1 }}>
                      Ton résumé
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                      XP, niveau, rang et dernier gain.
                    </Typography>
                  </Box>

                  <Chip icon={<EmojiEventsRoundedIcon />} label={rankLabel} variant="outlined" />
                </Stack>

                <Divider sx={{ opacity: 0.15 }} />

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <Chip icon={<MilitaryTechRoundedIcon />} label={`${xpTotal} XP`} variant="outlined" />
                  <Chip label={`Niveau ${levelInfo.level}`} variant="outlined" />
                  <Chip
                    icon={<BoltRoundedIcon />}
                    label={`${levelInfo.xpToNext} XP avant le prochain niveau`}
                    variant="outlined"
                    sx={{ flex: 1, justifyContent: "flex-start" }}
                  />
                </Stack>

                <Box>
                  <LinearProgress variant="determinate" value={levelInfo.progress01 * 100} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {levelInfo.xpIntoLevel} /{" "}
                      {Math.max(1, levelInfo.levelEndXp - levelInfo.levelStartXp)} XP
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {Math.round(levelInfo.progress01 * 100)}%
                    </Typography>
                  </Box>
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Dernier gain
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {lastXpEventAt ? formatDate(lastXpEventAt) : "—"}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/leaderboard")}
                    sx={{ borderRadius: 999 }}
                  >
                    Voir le classement
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* History */}
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <HistoryRoundedIcon />
                  <Typography sx={{ fontWeight: 900 }}>Gains récents</Typography>
                </Stack>

                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {history?.generatedAt ? `Mis à jour : ${formatDate(history.generatedAt as any)}` : ""}
                </Typography>
              </Stack>

              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                Les derniers événements qui ont impacté ton XP.
              </Typography>

              <Divider sx={{ mb: 1, opacity: 0.2 }} />

              {error && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {error}
                </Alert>
              )}

              {loading && !history ? (
                <Stack spacing={1}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Skeleton variant="circular" width={36} height={36} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="55%" />
                        <Skeleton width="40%" />
                      </Box>
                      <Skeleton width={72} height={28} />
                    </Box>
                  ))}
                </Stack>
              ) : events.length === 0 ? (
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  Aucun gain d’XP pour le moment.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {groupedHistory.map((g) => (
                    <Box key={g.day}>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.75, fontWeight: 800, display: "block", mb: 0.5 }}
                      >
                        {g.label}
                      </Typography>

                      <Stack spacing={0.75}>
                        {g.events.map((ev) => {
                          const delta = getXpDelta(ev);
                          const label = shortEventLabel(ev.eventKey);
                          const icon = eventIcon(ev.eventKey);

                          const subtitleParts: string[] = [];
                          if (ev.createdAt) subtitleParts.push(formatDate(ev.createdAt));
                          if ((ev as any).sourceType) subtitleParts.push(String((ev as any).sourceType));
                          if ((ev as any).sourceId != null)
                            subtitleParts.push(`#${String((ev as any).sourceId)}`);

                          return (
                            <Box
                              key={ev.id}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 1,
                                py: 0.75,
                                borderRadius: 2,
                                bgcolor: "rgba(255,255,255,0.03)",
                                outline: "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(255,255,255,0.06)" }}>
                                {icon}
                              </Avatar>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 900 }} noWrap>
                                  {label}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }} noWrap>
                                  {subtitleParts.join(" · ") || "—"}
                                </Typography>
                              </Box>

                              <Chip
                                size="small"
                                icon={<BoltRoundedIcon />}
                                label={`${delta >= 0 ? "+" : ""}${delta} XP`}
                                variant="outlined"
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}

              <Box sx={{ mt: 1.25 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  disabled={loadingMore || !canLoadMore}
                  onClick={loadMore}
                  sx={{ borderRadius: 999 }}
                >
                  {loadingMore ? "Chargement..." : canLoadMore ? "Charger plus" : "Fin de l’historique"}
                </Button>
              </Box>

              {/* Micro-action “fiable” : en cas d’erreur seulement */}
              {!loading && error && (
                <Box sx={{ mt: 1 }}>
                  <Button fullWidth variant="text" onClick={loadFirst} sx={{ borderRadius: 999 }}>
                    Réessayer
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Container>
  );
};

export default XpHubPage;
