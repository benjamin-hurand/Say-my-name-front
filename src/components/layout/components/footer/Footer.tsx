// src/components/layout/components/footer/Footer.tsx
import React from "react";
import {
  Brightness4,
  Brightness7,
  Business,
  Home,
  Language,
  Logout,
  Settings,
  Add,
  CheckCircle,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../contexts/AuthContext";
import { useThemeColorContext } from "../../../../contexts/ThemeColorContext";
import { notifyError, notifySuccess } from "../../../../services/notification/toast.service";
import "../../layout.css";

interface FooterProps {
  isMenu?: boolean;
  handleHomeClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ isMenu, handleHomeClick }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const { color, randomizeColor, toggleTheme, theme: currentTheme, accentMode } = useThemeColorContext();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const { tenants, activeTenant, switchTenant, logout } = useAuth();

  const hasOrgs = (tenants?.length ?? 0) > 0;

  // ----------------------------
  // Tenant Hub (responsive)
  // ----------------------------
  const [orgAnchorEl, setOrgAnchorEl] = React.useState<HTMLElement | null>(null);
  const [orgDrawerOpen, setOrgDrawerOpen] = React.useState(false);

  const openOrgHub = (anchor?: HTMLElement) => {
    if (isDesktop) setOrgAnchorEl(anchor ?? null);
    else setOrgDrawerOpen(true);
  };

  const closeOrgHub = () => {
    setOrgAnchorEl(null);
    setOrgDrawerOpen(false);
  };

  const handleOrgClick = (event: React.MouseEvent<HTMLElement>) => {
    openOrgHub(event.currentTarget);
  };

  const handleSwitchOrg = (orgId: number) => {
    switchTenant(orgId);
    closeOrgHub();
  };

  const goCreateOrg = () => {
    closeOrgHub();
    navigate("/settings");
  };

  // ----------------------------
  // Join by code dialog
  // ----------------------------
  const [joinOpen, setJoinOpen] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState("");
  const [joinLoading, setJoinLoading] = React.useState(false);

  const openJoin = () => {
    closeOrgHub();
    setJoinOpen(true);
  };

  const closeJoin = () => {
    if (joinLoading) return;
    setJoinOpen(false);
    setJoinCode("");
  };

  const submitJoin = async () => {
    const code = joinCode.trim();
    if (!code) return;

    setJoinLoading(true);
    try {
      // TODO (backend): appeler ton endpoint "join by code"
      // ex: await joinTenantByCode(code);
      // puis refresh session/orgs
      notifySuccess("Code reçu. Finalise le branchement API pour rejoindre l’organisation.");
      closeJoin();
    } catch (e: any) {
      notifyError(e?.response?.data?.message || "Impossible de rejoindre l’organisation avec ce code.");
      setJoinLoading(false);
    }
  };

  // ----------------------------
  // Language Menu
  // ----------------------------
  const [langAnchorEl, setLangAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMouseEnter = () => {
    if (accentMode === "random-hover") randomizeColor();
  };

  const handleOpenLanguageMenu = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLanguageChange = (newLang: string) => {
    i18n.changeLanguage(newLang).then(() => setLangAnchorEl(null));
  };

  // ----------------------------
  // Auth
  // ----------------------------
  const handleLogout = async () => {
    await logout({ provider: "google", reason: "footer-logout" });
    notifySuccess("Successfully disconnected.");
    navigate("/signin", { replace: true });
  };

  const handleGoSettings = () => navigate("/settings");

  // ----------------------------
  // Shared styling
  // ----------------------------
  const iconButtonStyle = {
    color: color,
    boxShadow: `0 0 8px ${color}`,
    transition: "box-shadow 0.2s ease-in-out",
    backdropFilter: "blur(6px)",
    backgroundColor: currentTheme === "dark" ? "#24242450" : "#ffffff50",
  } as const;

  const hubSurfaceSx = {
    borderRadius: 3,
    border: `1px solid ${alpha(color, currentTheme === "dark" ? 0.18 : 0.14)}`,
    backgroundColor: currentTheme === "dark" ? alpha("#121212", 0.92) : alpha("#ffffff", 0.88),
    backdropFilter: "blur(10px)",
  } as const;

  const orgTooltip = activeTenant
    ? `Organisation : ${activeTenant.tenantName}`
    : "Organisation";

  const HubContent = (
    <Box sx={{ p: 1.5, minWidth: isDesktop ? 360 : "auto" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Business sx={{ color }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} noWrap>
            Espace de travail
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {activeTenant ? `Actif : ${activeTenant.tenantName}` : "Aucune organisation active"}
          </Typography>
        </Box>

        {activeTenant?.role && (
          <Chip
            size="small"
            label={String(activeTenant.role)}
            sx={{
              borderRadius: 999,
              fontWeight: 800,
              height: 24,
              backgroundColor: currentTheme === "dark" ? alpha("#ffffff", 0.08) : alpha("#000000", 0.06),
            }}
          />
        )}
      </Stack>

      <Divider sx={{ mb: 1.25 }} />

      {/* Tenants */}
      <Typography variant="overline" sx={{ opacity: 0.75, letterSpacing: 0.8 }}>
        Organisations
      </Typography>

      <List dense disablePadding sx={{ mt: 0.5 }}>
        {tenants.map((org) => {
          const isActive = org.tenantId === activeTenant?.tenantId;
          return (
            <ListItemButton
              key={org.tenantId}
              onClick={() => handleSwitchOrg(org.tenantId)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                border: "1px solid",
                borderColor: isActive ? alpha(color, 0.65) : "transparent",
                backgroundColor: isActive
                  ? (currentTheme === "dark" ? alpha("#ffffff", 0.06) : alpha("#000000", 0.04))
                  : "transparent",
                "&:hover": {
                  backgroundColor: currentTheme === "dark" ? alpha("#ffffff", 0.08) : alpha("#000000", 0.06),
                },
              }}
            >
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={isActive ? 900 : 700} noWrap sx={{ flexGrow: 1 }}>
                      {org.tenantName}
                    </Typography>
                    {isActive && <CheckCircle sx={{ fontSize: 18, color }} />}
                  </Stack>
                }
                secondary={org.role ? `Rôle : ${org.role}` : undefined}
                primaryTypographyProps={{ sx: { lineHeight: 1.15 } }}
                secondaryTypographyProps={{ sx: { fontSize: 12, opacity: 0.8 } }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ mt: 1.25, mb: 1.25 }} />

      {/* Actions */}
      <Stack direction={isDesktop ? "row" : "column"} spacing={1}>
        <Button
          variant="contained"
          onClick={goCreateOrg}
          startIcon={<Add />}
          size="small"
          sx={{ borderRadius: 999, flex: 1, textTransform: "none", fontWeight: 800 }}
        >
          Créer
        </Button>
        <Button
          variant="outlined"
          onClick={openJoin}
          size="small"
          sx={{ borderRadius: 999, flex: 1, textTransform: "none", fontWeight: 800 }}
        >
          Rejoindre (code)
        </Button>
      </Stack>

      <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.7 }}>
        Le changement d’organisation impacte quiz, progression et administration.
      </Typography>
    </Box>
  );

  return (
    <div className="footer">
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ width: "400px", padding: "5px" }}>
        {/* Tenant button hidden when no orgs */}
        {hasOrgs && (
          <>
            <Tooltip title={orgTooltip} arrow>
              <IconButton
                className="menu"
                style={iconButtonStyle}
                aria-label="tenant"
                onClick={handleOrgClick}
                onMouseEnter={handleMouseEnter}
              >
                <Business style={{ color }} />
              </IconButton>
            </Tooltip>

            <Popover
              open={isDesktop && Boolean(orgAnchorEl)}
              anchorEl={orgAnchorEl}
              onClose={closeOrgHub}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
              transformOrigin={{ vertical: "bottom", horizontal: "center" }}
              PaperProps={{
                sx: {
                  ...hubSurfaceSx,
                  overflow: "hidden",
                  boxShadow: `0 12px 40px ${alpha("#000", currentTheme === "dark" ? 0.55 : 0.18)}`,
                },
              }}
            >
              {HubContent}
            </Popover>

            <Drawer
              anchor="bottom"
              open={!isDesktop && orgDrawerOpen}
              onClose={closeOrgHub}
              PaperProps={{
                sx: {
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  pb: 2,
                  ...hubSurfaceSx,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }}
            >
              <Box sx={{ pt: 1, pb: 0.5 }}>
                <Box
                  sx={{
                    mx: "auto",
                    width: 42,
                    height: 5,
                    borderRadius: 999,
                    opacity: 0.35,
                    backgroundColor: "text.primary",
                  }}
                />
              </Box>

              <Box sx={{ px: 1.5, pb: 1.5 }}>
                <Box sx={{ maxWidth: 520, mx: "auto" }}>{HubContent}</Box>
              </Box>
            </Drawer>
          </>
        )}

        {/* Settings */}
        <Tooltip title="Settings" arrow>
          <IconButton
            className="menu"
            style={iconButtonStyle}
            aria-label="settings"
            onMouseEnter={handleMouseEnter}
            onClick={handleGoSettings}
          >
            <Settings style={{ color }} />
          </IconButton>
        </Tooltip>

        {/* Theme */}
        <Tooltip title={currentTheme === "dark" ? "Light mode" : "Dark mode"} arrow>
          <IconButton
            className="menu"
            style={iconButtonStyle}
            aria-label="toggle dark/light mode"
            onClick={toggleTheme}
            onMouseEnter={handleMouseEnter}
          >
            {currentTheme === "dark" ? <Brightness7 style={{ color }} /> : <Brightness4 style={{ color }} />}
          </IconButton>
        </Tooltip>

        {/* Language */}
        <Tooltip title="Language" arrow>
          <IconButton
            className="menu"
            style={iconButtonStyle}
            aria-label="change language"
            onMouseEnter={handleMouseEnter}
            onClick={handleOpenLanguageMenu}
          >
            <Language style={{ color }} />
          </IconButton>
        </Tooltip>

        <Menu
          id="language-menu"
          anchorEl={langAnchorEl}
          open={Boolean(langAnchorEl)}
          onClose={() => setLangAnchorEl(null)}
          anchorOrigin={{ vertical: "center", horizontal: "center" }}
          transformOrigin={{ vertical: "center", horizontal: "center" }}
        >
          <MenuItem onClick={() => handleLanguageChange("en")}>English</MenuItem>
          <MenuItem onClick={() => handleLanguageChange("fr")}>Français</MenuItem>
          <MenuItem onClick={() => handleLanguageChange("es")}>Español</MenuItem>
        </Menu>

        {/* Logout / Home */}
        {isMenu ? (
          <Tooltip title="Logout" arrow>
            <IconButton
              className="menu"
              style={iconButtonStyle}
              aria-label="logout"
              onClick={handleLogout}
              onMouseEnter={handleMouseEnter}
            >
              <Logout style={{ color }} />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Home" arrow>
            <IconButton
              className="menu"
              style={iconButtonStyle}
              aria-label="home"
              onClick={handleHomeClick}
              onMouseEnter={handleMouseEnter}
            >
              <Home style={{ color }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Join by code dialog (global) */}
      <Dialog
        open={joinOpen}
        onClose={closeJoin}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Rejoindre une organisation</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Saisis le code fourni par ton équipe. Exemple : <strong>ABCD-1234</strong>
            </Typography>

            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Code"
              placeholder="ABCD-1234"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              inputProps={{ style: { textTransform: "uppercase", letterSpacing: 1 } }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitJoin();
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={closeJoin} disabled={joinLoading}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={submitJoin}
            disabled={!joinCode.trim() || joinLoading}
            sx={{ borderRadius: 999, fontWeight: 800, textTransform: "none" }}
          >
            {joinLoading ? "Connexion…" : "Rejoindre"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Footer;
