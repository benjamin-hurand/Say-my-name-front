import * as React from "react";
import {
  Paper, Typography, List, ListItemButton, ListItemText, Divider, Switch, FormControlLabel, Box, FormHelperText
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const PrivacyHelpSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [analyticsConsent, setAnalyticsConsent] = React.useState<boolean>(false);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t("PRIVACY_HELP_ABOUT", "Privacy, help & about")}
      </Typography>
      <List disablePadding>
        <ListItemButton onClick={() => navigate("/legal/privacy")}>
          <ListItemText
            primary={t("PRIVACY_POLICY", "Privacy Policy")}
            secondary={t("PRIVACY_POLICY_DESC", "Learn how we handle your data")}
          />
        </ListItemButton>

        <Divider component="li" />

        <ListItemButton onClick={() => { /* export user data */ }}>
          <ListItemText
            primary={t("EXPORT_DATA", "Export my data")}
            secondary={t("EXPORT_DATA_DESC", "Download a copy of your data")}
          />
        </ListItemButton>

        <Divider component="li" />

        <Box sx={{ px: 2, py: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={analyticsConsent}
                onChange={(_, c) => setAnalyticsConsent(c)}
                inputProps={{ "aria-label": "analytics consent" }}
              />
            }
            label={t("ANALYTICS_CONSENT", "Analytics consent")}
          />
          <FormHelperText>
            {t("ANALYTICS_CONSENT_DESC", "Allow anonymous usage metrics")}
          </FormHelperText>
        </Box>

        <Divider component="li" />

        <ListItemButton onClick={() => navigate("/help")}>
          <ListItemText
            primary={t("HELP_CENTER", "Help center")}
            secondary={t("HELP_CENTER_DESC", "FAQ & support")}
          />
        </ListItemButton>

        <Divider component="li" />

        <ListItemButton onClick={() => navigate("/legal/about")}>
          <ListItemText
            primary={t("ABOUT", "About")}
            secondary={`App version: 0.1.0`}
          />
        </ListItemButton>
      </List>
    </Paper>
  );
};

export default PrivacyHelpSection;
