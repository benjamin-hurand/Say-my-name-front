import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import PsychologyAltRoundedIcon from "@mui/icons-material/PsychologyAltRounded";
import { Alert, AlertTitle } from "@mui/material";
import { useTranslation } from "react-i18next";

type Props = {
  isEdit: boolean;
  appliedSuggestionMessage: string | null;
  duplicateSystemConceptBlocked: boolean;
  conceptTypeMismatch: boolean;
};

export default function AttributeFormAlerts({
  isEdit,
  appliedSuggestionMessage,
  duplicateSystemConceptBlocked,
  conceptTypeMismatch,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      {!isEdit && (
        <Alert
          severity="info"
          icon={<PsychologyAltRoundedIcon />}
          sx={{ borderRadius: 2.5, mb: 2 }}
        >
          <AlertTitle>
            {t("ATTRIBUTE_FORM.SIMPLEST_TITLE", {
              defaultValue: "Le plus simple",
            })}
          </AlertTitle>
          {t("ATTRIBUTE_FORM.SIMPLEST_TEXT", {
            defaultValue:
              "Choisis un concept standard ou un attribut personnalisé. Le formulaire affichera seulement les réglages utiles.",
          })}
        </Alert>
      )}

      {appliedSuggestionMessage && (
        <Alert
          severity="success"
          icon={<AutoAwesomeRoundedIcon />}
          sx={{ borderRadius: 2.5, mb: 2 }}
        >
          {appliedSuggestionMessage}
        </Alert>
      )}

      {duplicateSystemConceptBlocked && (
        <Alert severity="error" sx={{ borderRadius: 2.5, mb: 2 }}>
          <AlertTitle>
            {t("ATTRIBUTE_FORM.DUPLICATE_SYSTEM_CONCEPT_TITLE", {
              defaultValue: "Concept système déjà utilisé",
            })}
          </AlertTitle>
          {t("ATTRIBUTE_FORM.DUPLICATE_SYSTEM_CONCEPT_TEXT", {
            defaultValue: "Ce concept est censé être unique dans le tenant.",
          })}
        </Alert>
      )}

      {conceptTypeMismatch && (
        <Alert severity="error" sx={{ borderRadius: 2.5, mb: 2 }}>
          <AlertTitle>
            {t("ATTRIBUTE_FORM.TYPE_MISMATCH_TITLE", {
              defaultValue: "Type incompatible",
            })}
          </AlertTitle>
          {t("ATTRIBUTE_FORM.TYPE_MISMATCH_TEXT", {
            defaultValue: "Le type sélectionné n’est pas compatible avec ce concept.",
          })}
        </Alert>
      )}
    </>
  );
}