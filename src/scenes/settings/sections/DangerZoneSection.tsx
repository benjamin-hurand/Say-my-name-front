import * as React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import SectionCard from "../SectionCard";

const DangerZoneSection: React.FC = () => {
  const { t } = useTranslation();

  const [openReset, setOpenReset] = React.useState(false);
  const [openRestart, setOpenRestart] = React.useState(false);
  const [resetInput, setResetInput] = React.useState("");

  const handleResetCourse = async () => {
    try {
      setOpenReset(false);
      setResetInput("");
    } catch {
      setOpenReset(false);
      setResetInput("");
    }
  };

  const handleRestartCourse = async () => {
    try {
      setOpenRestart(false);
    } catch {
      setOpenRestart(false);
    }
  };

  return (
    <>
      <SectionCard
        headerTitle={t("DANGER_ZONE", "Danger zone")}
        subtitle={t("DANGER_ZONE_SUB","Actions irréversibles")}
        defaultExpanded={false}
        sx={(theme) => ({
          borderColor: theme.palette.error.main,
        })}
        headerSx={(theme) => ({
          "& .MuiCardHeader-title": { color: theme.palette.error.main },
        })}
      >
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="warning" onClick={() => setOpenRestart(true)}>
            {t("RESTART_COURSE", "Restart course")}
          </Button>
          <Button variant="outlined" color="error" onClick={() => setOpenReset(true)}>
            {t("RESET_PROGRESS", "Reset progress")}
          </Button>
        </Stack>
      </SectionCard>

      {/* Dialogs */}
      <Dialog open={openRestart} onClose={() => setOpenRestart(false)}>
        <DialogTitle>{t("CONFIRM_RESTART_TITLE", "Restart the course?")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("CONFIRM_RESTART_DESC", "This will start the current course from the beginning.")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRestart(false)}>{t("CANCEL", "Cancel")}</Button>
          <Button color="warning" onClick={handleRestartCourse}>{t("CONFIRM", "Confirm")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReset} onClose={() => setOpenReset(false)}>
        <DialogTitle>{t("CONFIRM_RESET_TITLE", "Reset all progress?")}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            {t("CONFIRM_RESET_DESC", "This will erase your progress for the current course. This action cannot be undone.")}
          </Typography>
          <TextFieldLike
            value={resetInput}
            onChange={setResetInput}
            label={t("TYPE_RESET_TO_CONFIRM", "Tape « RESET » pour confirmer")}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReset(false)}>{t("CANCEL", "Cancel")}</Button>
          <Button
            color="error"
            onClick={handleResetCourse}
            disabled={resetInput.trim().toUpperCase() !== "RESET"}
          >
            {t("CONFIRM", "Confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Petit composant interne pour éviter d'importer TextField si tu veux garder ce fichier léger
const TextFieldLike: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  return (
    <div style={{ marginTop: 8 }}>
      <label style={{ display: "block", fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{label}</label>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid rgba(0,0,0,0.23)",
          background: "transparent",
          color: "inherit",
        }}
      />
    </div>
  );
};

export default DangerZoneSection;
