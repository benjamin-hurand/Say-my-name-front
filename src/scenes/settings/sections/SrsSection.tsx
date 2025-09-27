import * as React from "react";
import { Box, Button, Divider, MenuItem, Skeleton, Stack, TextField, Typography, Chip as MuiChip } from "@mui/material";
import { useTranslation } from "react-i18next";
import SectionCard from "../SectionCard";
import AdvancedBlock from "../AdvancedBlock";
import { SrsAlgorithm } from "../../../models/commons/User";
import { getMySrsAlgorithm, updateMySrsAlgorithm } from "../../../services/business/settings/userSettings.service";
import { notifyError, notifySuccess } from "../../../services/notification/toast.service";

type Props = {
  showAdvanced: boolean;
};

const SrsSection: React.FC<Props> = ({ showAdvanced }) => {
  const { t } = useTranslation();

  const [srsCurrent, setSrsCurrent] = React.useState<SrsAlgorithm | null>(null);
  const [srsSelected, setSrsSelected] = React.useState<SrsAlgorithm | "">("");
  const [srsLoading, setSrsLoading] = React.useState<boolean>(true);
  const [srsSaving, setSrsSaving] = React.useState<boolean>(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const algo = await getMySrsAlgorithm();
        if (!mounted) return;
        setSrsCurrent(algo);
        setSrsSelected(algo);
      } catch {
        notifyError(t("SRS_LOAD_FAILED", "Failed to load SRS preferences"));
      } finally {
        if (mounted) setSrsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [t]);

  const srsSummary = srsLoading ? t("LOADING","Loading…") : (srsSelected || srsCurrent || "—");
  const hasSrsChanges = srsSelected !== "" && srsSelected !== srsCurrent;

  const handleSaveSrs = async () => {
    if (srsSelected === "" || srsSelected === srsCurrent) return;
    setSrsSaving(true);
    try {
      const saved = await updateMySrsAlgorithm(srsSelected as SrsAlgorithm);
      setSrsCurrent(saved);
      setSrsSelected(saved);
      notifySuccess(t("SRS_SAVED", "SRS algorithm updated"));
    } catch {
      notifyError(t("SRS_SAVE_FAILED", "Failed to update SRS algorithm"));
    } finally {
      setSrsSaving(false);
    }
  };

  const handleResetSrs = () => {
    setSrsSelected(srsCurrent ?? SrsAlgorithm.SM2);
  };

  return (
    <SectionCard
      headerTitle={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6">
            {t("SRS_TITLE", "Spaced Repetition (SRS)")}
          </Typography>
          <MuiChip size="small" label={t("EXPERIMENTAL", "Experimental")} />
        </Stack>
      }
      subtitle={srsSummary}
      defaultExpanded={false}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("SRS_DESC", "Choose the algorithm used to schedule your reviews. You can switch anytime.")}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        {srsLoading ? (
          <Skeleton variant="rounded" width={240} height={40} />
        ) : (
          <TextField
            select
            size="small"
            disabled={srsLoading}
            label={t("SRS_ALGO", "Algorithm")}
            value={srsSelected}
            onChange={(e) => setSrsSelected(e.target.value as SrsAlgorithm)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value={SrsAlgorithm.SM2}>SM-2 (Anki-like)</MenuItem>
            <MenuItem value={SrsAlgorithm.PFA}>PFA (Probabilistic Forgetting)</MenuItem>
            <MenuItem value={SrsAlgorithm.FSRS}>FSRS (Modern, data-driven)</MenuItem>
          </TextField>
        )}

        <Button
          variant="contained"
          disabled={!hasSrsChanges || srsSaving || srsLoading}
          onClick={handleSaveSrs}
        >
          {srsSaving ? t("SAVING", "Saving...") : t("SAVE", "Save")}
        </Button>
        <Button
          variant="text"
          disabled={!hasSrsChanges || srsSaving || srsLoading}
          onClick={handleResetSrs}
        >
          {t("RESET", "Reset")}
        </Button>
      </Box>

      {showAdvanced && (
        <AdvancedBlock label={t("LEARN_MORE", "En savoir plus")} defaultOpen={false}>
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2">SM-2</Typography>
            <Typography variant="caption" color="text.secondary">
              {t("SRS_SM2_DESC", "Classic algorithm (SuperMemo 2). Stable and predictable.")}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2">PFA</Typography>
            <Typography variant="caption" color="text.secondary">
              {t("SRS_PFA_DESC", "Probabilistic model tuned with forgetting curves.")}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2">FSRS</Typography>
            <Typography variant="caption" color="text.secondary">
              {t("SRS_FSRS_DESC", "Recent, data-driven scheduling with flexible parameters.")}
            </Typography>
          </Box>
        </AdvancedBlock>
      )}
    </SectionCard>
  );
};

export default SrsSection;
