// src/scenes/courses/StartCourse.tsx
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";

import { useTenantData } from "../../contexts/TenantDataContext";

import { createCourse } from "../../services/business/courses/course.service";
import { searchPersons } from "../../services/business/persons/person.service";
import { CreateCourseDto } from "../../services/dto/courses/CourseDto";
import { PersonCardDto } from "../../services/dto/person/search/PersonCardDtos";
import { notifyError, notifySuccess } from "../../services/notification/toast.service";
import { Attribute } from "../../models/commons/Attribute/Attribute";

// PopulationScope côté front = "FOLLOWED" | "ALL". On force "FOLLOWED" ici.
const StartCourse: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); 
  const { t } = useTranslation();
  const { attributes } = useTenantData();

  const [selectedTargetAttribute, setSelectedTargetAttribute] = useState<Attribute | null>(null);
  const [followedCount, setFollowedCount] = useState<number>(0);
  const [followedPreview, setFollowedPreview] = useState<PersonCardDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialisation
  useEffect(() => {
    if (attributes.length) {
      const q = searchParams.get('targetAttributeId');
      const found = q ? attributes.find(a => a.id === Number(q)) : undefined;
      setSelectedTargetAttribute(found || attributes[0]);
    }
  }, [attributes, searchParams]);

  // Récupération suivis via searchPersons (count + preview visuelle)
  useEffect(() => {
    const fetchFollowed = async () => {
      try {
        const countPage = await searchPersons(
          {
            followFilter: "FOLLOWED",
            includeContextAttributes: false,
            sort: [{ kind: "FIELD", field: "id", direction: "ASC" }],
          },
          0,
          1
        );
        const total = (countPage as any)?.totalElements ?? countPage?.content?.length ?? 0;
        setFollowedCount(total);

        const previewPage = await searchPersons(
          {
            followFilter: "FOLLOWED",
            includeContextAttributes: false,
            sort: [{ kind: "FIELD", field: "id", direction: "ASC" }],
          },
          0,
          12
        );
        setFollowedPreview(previewPage?.content ?? []);
      } catch {
        setFollowedCount(0);
        setFollowedPreview([]);
      }
    };
    fetchFollowed();
  }, []);

  const canStart = Boolean(selectedTargetAttribute && followedCount > 0);

  const handleCreate = async () => {
    if (!canStart || !selectedTargetAttribute) {
      notifyError(t("COURSE_CREATE_FILL_ALL", "Veuillez compléter la configuration"));
      return;
    }

    const dto: CreateCourseDto = {
      targetAttributeId: selectedTargetAttribute.id,
      populationScope: "FOLLOWED",
    };

    try {
      setIsSubmitting(true);
      const created = await createCourse(dto);
      notifySuccess(t("COURSE_CREATED", "Parcours démarré !"));
      navigate(`/course/${created.id}/continue`);
    } catch (err: any) {
      notifyError(
        err?.response?.data?.message || t("COURSE_CREATE_ERROR", "Erreur lors du démarrage du parcours")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrimaryText = (p: PersonCardDto) => {
    const parts = (p.primaryAttributes || []).map((a) => a.value).filter(Boolean);
    return parts.join(" ").trim() || `#${p.idPerson}`;
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: { xs: 1.5, sm: 2 },
          py: 2,
          pb: "calc(var(--footer-height) + 16px)",
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {t("COURSE_START_TITLE", "Démarrer mon parcours d'entraînement")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t(
            "COURSE_START_SUB",
            "Nous allons générer une progression personnalisée basée sur les personnes que vous suivez."
          )}
        </Typography>

        {/* Population (FOLLOWED) */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardHeader
            titleTypographyProps={{ variant: "subtitle1", fontWeight: 700 }}
            title={t("COURSE_POPULATION", "Population d'entraînement")}
            avatar={<PeopleAltRounded />}
            action={
              <Button size="small" component={RouterLink} to="/trombinoscope" endIcon={<OpenInNewRounded />}>
                {t("MANAGE_FOLLOWS", "Gérer mes suivis")}
              </Button>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
              <Chip icon={<StarRounded />} color="primary" label={t("FOLLOWED", "Personnes suivies")} />
              <Chip
                variant="outlined"
                label={t("FOLLOWED_COUNT", { defaultValue: "{{count}} sélectionnées", count: followedCount })}
              />
              <Tooltip
                title={
                  t(
                    "COURSE_POPULATION_LOCKED",
                    "La population est désormais automatiquement basée sur vos suivis."
                  ) as string
                }
              >
                <InfoOutlined fontSize="small" color="action" />
              </Tooltip>
            </Stack>

            {followedPreview.length > 0 && (
              <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
                {followedPreview.map((p) => (
                  <Chip
                    key={p.idPerson}
                    avatar={
                      p.photoSmallUrl ? (
                        <img
                          src={p.photoSmallUrl}
                          alt={getPrimaryText(p)}
                          style={{ width: 24, height: 24, borderRadius: "50%" }}
                        />
                      ) : undefined
                    }
                    label={getPrimaryText(p)}
                    variant="outlined"
                    sx={{ maxWidth: "100%" }}
                  />
                ))}
                {followedCount > followedPreview.length && <Chip label={`+${followedCount - followedPreview.length}`} />}
              </Stack>
            )}

            {followedCount === 0 && (
              <Alert sx={{ mt: 2 }} severity="info" icon={<InfoOutlined />}>
                {t(
                  "NO_FOLLOWED_HINT",
                  "Vous ne suivez encore personne. Ouvrez le trombinoscope pour choisir des personnes à suivre."
                )}
              </Alert>
            )}

            <InlineHint>
              {t(
                "HINT_POPULATION_INLINE",
                "Visez une sélection compacte (≈10–30 personnes) : trop peu, vous tournez en rond ; trop large, votre attention se dilue. Ajustez vos suivis au fil des progrès."
              )}
            </InlineHint>
          </CardContent>
        </Card>

        {/* Modes */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardHeader
            titleTypographyProps={{ variant: "subtitle1", fontWeight: 700 }}
            title={t("GAME_MODE", "Mode d'entraînement")}
          />
          <CardContent sx={{ pt: 0 }}>
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
              {attributes.map((a) => {
                const selected = a.id === selectedTargetAttribute?.id;
                return (
                  <Chip
                    key={a.id}
                    clickable
                    onClick={() => setSelectedTargetAttribute(a)}
                    color={selected ? "primary" : undefined}
                    variant={selected ? "filled" : "outlined"}
                    icon={selected ? <CheckRounded /> : undefined}
                    label={a.name}
                    sx={{ minHeight: 36 }}
                    aria-pressed={selected}
                  />
                );
              })}
            </Stack>

            <InlineHint>
              {t(
                "HINT_MODE_INLINE",
                "Commencez par un objectif simple (p. ex. mémoriser les prénoms). Quand le réflexe est en place, changez de mode pour varier et consolider."
              )}
            </InlineHint>
          </CardContent>
        </Card>

        {/* CTA */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 2, justifyContent: "flex-end" }}>
          <Button
            size="large"
            variant="contained"
            endIcon={<ArrowForwardRounded />}
            onClick={handleCreate}
            disabled={!canStart || isSubmitting}
          >
            {t("CREATE_COURSE", "Démarrer le parcours")}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default StartCourse;

// Composant interne : astuce inline discrète
function InlineHint({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 1.5 }}>
      <InfoOutlined fontSize="small" color="action" />
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
        {children}
      </Typography>
    </Box>
  );
}
