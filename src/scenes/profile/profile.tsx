// src/scenes/profile/ProfilePage.tsx

import React, { useState, useCallback } from "react";
import {
  Container,
  Stack,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  IconButton,
  TextField,
  CircularProgress,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Tooltip,
  Menu,
  MenuItem
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  ZoomOutMap as ZoomIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon
} from "@mui/icons-material";
import { useProfile } from "../../contexts/ProfileContext";
import { Navigate } from "react-router-dom";
import {
  updatePhoto,
  updateAttributes,
  updateAccount,
} from "../../services/business/profile/profile.service";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import getCroppedImg from "../../utils/getCroppedImg";

const neonText = {
  textShadow: "0 0 8px rgba(0, 255, 255, 0.8)",
};

const MIN_UPLOAD_SIZE = 1024 * 50;       // 50 KB
const MAX_UPLOAD_SIZE = 1024 * 1024 * 5; // 5 MB

const ProfilePage: React.FC = () => {
  const { user, profile, loading, refreshProfile } = useProfile();
  const assetBase = import.meta.env.BASE_URL || "/";

  // --- Photo cropping / upload states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Lightbox menu anchor
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  // --- Dropzone setup
  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    if (file.size < MIN_UPLOAD_SIZE) {
      setErrorMsg("Fichier trop petit (≥ 50 KB).");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setErrorMsg("Fichier trop volumineux (≤ 5 MB).");
      return;
    }
    setErrorMsg(null);
    setRawFile(file);
    setCropModalOpen(true);
  }, []);
  const { getRootProps, getInputProps, open: openDropzone } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  // --- Cropper handlers
  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);
  const handleCropSave = async () => {
    if (!rawFile || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedImg(
        URL.createObjectURL(rawFile),
        croppedAreaPixels,
        rotation
      );
      const form = new FormData();
      form.append("photo", blob, rawFile.name);
      await updatePhoto(form);
      await refreshProfile();
      setCropModalOpen(false);
      setRawFile(null);
      setZoom(1);
      setRotation(0);
    } catch {
      setErrorMsg("Erreur lors du recadrage.");
    } finally {
      setUploading(false);
    }
  };

  // --- Delete photo
  const handleDeletePhoto = async () => {
    setUploading(true);
    try {
      await updatePhoto(null as any);
      await refreshProfile();
      setLightboxOpen(false);
    } finally {
      setUploading(false);
    }
  };

  // --- Attributes inline edit states
  const [editingAttrId, setEditingAttrId] = useState<number | null>(null);
  const [attrValue, setAttrValue] = useState<string>("");
  const [savingAttrId, setSavingAttrId] = useState<number | null>(null);

  if (!user) return <Navigate to="/login" replace />;
  if (loading || !profile) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  // --- Attribute handlers
  const handleEditAttr = (id: number, current: string) => {
    setEditingAttrId(id);
    setAttrValue(current);
  };
  const handleSaveAttr = async (id: number) => {
    setSavingAttrId(id);
    await updateAttributes([{ id, value: attrValue }]);
    await refreshProfile();
    setSavingAttrId(null);
    setEditingAttrId(null);
  };
  const handleCancelAttr = () => {
    setEditingAttrId(null);
    setAttrValue("");
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        height: "calc(100vh - var(--header-height) - var(--footer-height))",
        display: "flex",
        flexDirection: "column",
        py: 2,
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={3} flex={1} sx={{ minHeight: 0 }}>
        {/* Avatar + Actions */}
        <Box
          {...getRootProps()}
          sx={{ display: "flex", justifyContent: "center", cursor: "pointer" }}
          onClick={() => setLightboxOpen(true)}
        >
          <input {...getInputProps()} />
          <Box sx={{ position: "relative", width: 120, height: 120 }}>
            <Avatar
              alt={`Avatar de ${user.username}`}
              src={profile.photo ? `${assetBase}photos/${profile.photo.url}` : undefined}
              sx={{ width: "100%", height: "100%" }}
            />
            <Tooltip title="Changer la photo">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); openDropzone(); }}
                sx={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  bgcolor: "rgba(0,0,0,0.6)",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                }}
              >
                {uploading ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon sx={{ color: "#fff" }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Voir en grand">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: "rgba(0,0,0,0.6)",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                }}
              >
                <ZoomIcon sx={{ color: "#fff" }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Lightbox Preview */}
        <Dialog
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ m: 0, p: 2, position: "relative" }}>
            {/* Ellipsis menu */}
            <IconButton
              aria-label="actions"
              onClick={handleMenuOpen}
              sx={{ position: "absolute", right: 40, top: 8 }}
            >
              <MoreVertIcon />
            </IconButton>
            <IconButton
              aria-label="close"
              onClick={() => setLightboxOpen(false)}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  openDropzone();
                }}
              >
                Modifier
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  handleDeletePhoto();
                }}
              >
                Supprimer
              </MenuItem>
            </Menu>
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center", pt: 0 }}>
            <Box
              component="img"
              src={profile.photo ? `${assetBase}photos/${profile.photo.url}` : undefined}
              alt={`Avatar de ${user.username}`}
              sx={{
                maxWidth: "100%",
                maxHeight: "calc(70vh - 100px)", // reserve ~100px for title/actions
                objectFit: "contain",
              }}
            />
          </DialogContent>
          <DialogActions sx={{ justifyContent: "flex-end", px: 3, py: 2 }}>
            <Button variant="outlined" onClick={() => setLightboxOpen(false)}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Crop Modal */}
        <Dialog
          open={cropModalOpen}
          onClose={() => setCropModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Recadrer votre photo</DialogTitle>
          <DialogContent>
            {rawFile && (
              <Box sx={{ position: "relative", width: "100%", height: 300, bgcolor: "#000" }}>
                <Cropper
                  image={URL.createObjectURL(rawFile)}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Zoom</Typography>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(_, v) => setZoom(v as number)}
              />
              <Typography gutterBottom>Rotation</Typography>
              <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                <IconButton onClick={() => setRotation(r => r - 90)}>
                  <RotateLeftIcon />
                </IconButton>
                <IconButton onClick={() => setRotation(r => r + 90)}>
                  <RotateRightIcon />
                </IconButton>
              </Box>
            </Box>
            {errorMsg && <Typography color="error" sx={{ mt: 1 }}>{errorMsg}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCropModalOpen(false)} disabled={uploading}>
              Annuler
            </Button>
            <Button
              onClick={handleCropSave}
              variant="contained"
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={18} /> : undefined}
            >
              {uploading ? "Envoi…" : "Valider"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Mon Compte */}
        <Card variant="outlined" sx={{ backdropFilter: "blur(12px)", bgcolor: "rgba(32,32,32,0.7)" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ flex: 1, ...neonText }}>
                Mon Compte
              </Typography>
            </Box>
                <Typography><strong>Username :</strong> {user.username}</Typography>
                <Typography><strong>Email :</strong> {user.email}</Typography>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      /* ici vous ouvrez votre modal / naviguez vers la page de changement de mot de passe */
                    }}
                  >
                    Changer le mot de passe
                  </Button>
                </Box>
          </CardContent>
        </Card>

        {/* Mes Attributs */}
        <Card
          variant="outlined"
          sx={{
            display: "flex",
            flexDirection: "column",
            backdropFilter: "blur(12px)",
            bgcolor: "rgba(32,32,32,0.7)",
          }}
        >
          <CardContent sx={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
            <Typography variant="h6" sx={neonText}>
              Mes Attributs
            </Typography>
          </CardContent>
          <CardContent
            className="scrollable-content"
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              px: 2,
            }}
          >
            <Stack spacing={2} divider={<Divider light />}>
              {(() => {
                // on initialise le compteur de noms
                const nameCount: Record<string, number> = {};
                return profile.attributes.map((attr) => {
                  // on incrémente le compteur
                  const baseName = attr.attribute.name;
                  nameCount[baseName] = (nameCount[baseName] || 0) + 1;
                  const idx = nameCount[baseName];
                  // on construit le label (avec index si non-unique)
                  const labelText = attr.attribute.unique
                    ? baseName
                    : `${baseName} ${idx}`;

                  const isEditing = editingAttrId === attr.id;
                  return (
                    <Box
                      key={attr.id}
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      <Box
                        flex={1}
                        sx={{ display: "flex", alignItems: "center", pr: 2 }}
                      >
                        {/* on cache le titre quand on édite */}
                        {!isEditing && (
                          <Typography variant="subtitle2" sx={neonText}>
                            {baseName}
                          </Typography>
                        )}

                        {isEditing ? (
                          // mode édition
                          attr.attribute.type === "date" ? (
                            <DatePicker
                              label={labelText}
                              value={attrValue ? dayjs(attrValue) : null}
                              onChange={(nv) =>
                                setAttrValue(nv?.toISOString() || "")
                              }
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  margin: "dense",
                                  size: "small",
                                  sx: {
                                    "& .MuiInputBase-root": { py: "4px" },
                                    "& .MuiInputBase-input": { lineHeight: 1.2 },
                                  },
                                },
                              }}
                            />
                          ) : (
                            <TextField
                              label={labelText}
                              value={attrValue}
                              onChange={(e) => setAttrValue(e.target.value)}
                              fullWidth
                              margin="dense"
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )
                        ) : (
                          // lecture seule
                          <Typography variant="body1" sx={{ ml: 1 }}>
                            {attr.value}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {isEditing ? (
                          // actions en édition
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleSaveAttr(attr.id!)}
                              disabled={savingAttrId === attr.id}
                            >
                              {savingAttrId === attr.id ? (
                                <CircularProgress size={18} />
                              ) : (
                                <SaveIcon />
                              )}
                            </IconButton>

                            {/* si non-unique, on propose un "+" pour ajouter une nouvelle valeur */}
                            {!attr.attribute.unique && (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  /* TODO : handleAddAttrList(attr.id) */
                                }}
                              >
                                <AddIcon />
                              </IconButton>
                            )}

                            <IconButton size="small" onClick={handleCancelAttr}>
                              <CloseIcon />
                            </IconButton>
                          </>
                        ) : (
                          // bouton d'édition
                          <IconButton
                            size="small"
                            onClick={() => handleEditAttr(attr.id!, attr.value)}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  );
                });
              })()}
            </Stack>
          </CardContent>
        </Card>

      </Stack>
    </Container>
  );
};

export default ProfilePage;
