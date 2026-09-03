// src/scenes/profile/components/PhotoAvatarSection.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Slider,
  Tooltip,
  Typography,
  Container,
  Stack,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  PhotoCamera as PhotoCameraIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  ZoomOutMap as ZoomIcon,
  AddAPhotoRounded as AddAPhotoRoundedIcon,
  PersonSearchRounded as PersonSearchRoundedIcon,
  InfoOutlined as InfoOutlinedIcon,
  LockRounded as LockRoundedIcon,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import { useNavigate } from "react-router-dom";

import { useProfile } from "../../../contexts/ProfileContext";
import { Photo } from "../../../models/commons/Photo";
import { submitPhotoForApproval } from "../../../services/business/photos/photo.service";
import { notifyError, notifySuccess } from "../../../services/notification/toast.service";
import getCroppedImg from "../../../utils/getCroppedImg";
import { getApiErrorMessage } from "../../../utils/apiError";
import { getPersonDisplayName } from "../../../utils/personDisplayName";

const MIN_UPLOAD_SIZE = 1024 * 1; // 1 KB
const MAX_UPLOAD_SIZE = 1024 * 1024 * 5; // 5 MB

type PersonLinkAction = "DISABLED" | "DIRECT" | "REQUEST";

function isEnabled(action: PersonLinkAction) {
  return action !== "DISABLED";
}

function getCtaLabel(base: string, action: PersonLinkAction) {
  return action === "REQUEST" ? `Demander ${base}` : base;
}

const PhotoAvatarSection: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, onboarding, loading, refreshProfile, setProfile } = useProfile();

  const displayName = profile
    ? getPersonDisplayName(profile)
    : user?.displayName ?? "Moi";
  const profileCurrentPhotoUrl =
    profile?.photos?.find((p) => p.status === "APPROVED")?.url ?? undefined;

  // --- états avatar / upload / crop ---
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<Photo | null>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- menu lightbox ---
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  // --- Dropzone ---
  const onDropAccepted = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setRawFile(file);
      setErrorMsg(null);

      // si une photo PENDING existe déjà, on demande confirmation
      const alreadyPending = profile?.photos?.find((p) => p.status === "PENDING");
      if (alreadyPending) {
        setPendingPhoto(alreadyPending);
        setConfirmReplaceOpen(true);
      }
      setCropModalOpen(true);
    },
    [profile?.photos]
  );

  const onDropRejected = useCallback((rejections: any[]) => {
    if (!rejections || rejections.length === 0) {
      notifyError("Import de fichier refusé.");
      return;
    }
    const first = rejections[0];
    const reasons = (first?.errors ?? []).map((e: any) => {
      switch (e.code) {
        case "file-too-large":
          return "Fichier trop volumineux (≤ 5 MB)";
        case "file-too-small":
          return "Fichier trop petit (≥ 1 KB)";
        case "file-invalid-type":
          return "Format de fichier non pris en charge";
        default:
          return e.message || "Import de fichier refusé";
      }
    });
    notifyError(reasons.join(" • "));
  }, []);

  const { getRootProps, getInputProps, open: openDropzone, inputRef } = useDropzone({
    onDropAccepted,
    onDropRejected,
    accept: { "image/*": [] },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
    minSize: MIN_UPLOAD_SIZE,
    maxSize: MAX_UPLOAD_SIZE,
  });

  // création/cleanup d'un unique Object URL à partir du fichier brut
  useEffect(() => {
    if (!rawFile) {
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(rawFile);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [rawFile]);

  // autoriser re-sélection du même fichier (reset input quand on ferme la modale)
  useEffect(() => {
    if (!cropModalOpen && inputRef?.current) {
      // @ts-ignore
      inputRef.current.value = null;
    }
  }, [cropModalOpen, inputRef]);

  // cropper
  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // === Optimistic submit : envoi + mise à jour locale (remplace/ajoute la PENDING)
  const handleCropSave = async () => {
    if (!rawFile || !croppedAreaPixels || !imageUrl || !profile) return;
    setUploading(true);
    try {
      const blob = await getCroppedImg(imageUrl, croppedAreaPixels, rotation);
      const mime = (blob as any).type || rawFile.type || "image/jpeg";
      const fileToSend = new File([blob], rawFile.name || `photo-${Date.now()}.jpg`, { type: mime });

      const newPhoto = await submitPhotoForApproval(profile.id, fileToSend);

      setProfile((prev) => {
        if (!prev) return prev;
        const alreadyPending = prev.photos.find((p) => p.status === "PENDING");
        const updatedPhotos = alreadyPending
          ? prev.photos.map((p) => (p.status === "PENDING" ? newPhoto : p))
          : [...prev.photos, newPhoto];
        return { ...prev, photos: updatedPhotos };
      });

      setCropModalOpen(false);
      setRawFile(null);
      setZoom(1);
      setRotation(0);
      setConfirmReplaceOpen(false);
      setPendingPhoto(null);

      notifySuccess("Photo soumise à vérification !");
    } catch (err: any) {
      const msg = getApiErrorMessage(err, "Erreur lors de la soumission de la photo.");
      setErrorMsg(msg);
      notifyError(msg);
    } finally {
      setUploading(false);
    }
  };

  // --- Loading ---
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 3 }}>
        <CircularProgress />
      </Container>
    );
  }

  // --- État onboarding (pas de Person liée) : CTA subtil + avatar placeholder ---
  if (!profile) {
    const createAction: PersonLinkAction = (onboarding?.createPerson as PersonLinkAction) ?? "DISABLED";
    const pickAction: PersonLinkAction = (onboarding?.pickPerson as PersonLinkAction) ?? "DISABLED";

    const nothingAllowed = createAction === "DISABLED" && pickAction === "DISABLED";
    const hasApproval = createAction === "REQUEST" || pickAction === "REQUEST";

    const onCreate = () => {
      if (!isEnabled(createAction)) return;
      navigate(createAction === "REQUEST" ? "/profile/create/request" : "/profile/create");
    };

    const onPick = () => {
      if (!isEnabled(pickAction)) return;
      navigate(pickAction === "REQUEST" ? "/profile/pick/request" : "/profile/pick");
    };

    return (
      <Container maxWidth="sm" sx={{ py: 1 }}>
        <Stack spacing={1.25} alignItems="center">
          <Box sx={{ position: "relative", width: 120, height: 120 }}>
            <Avatar
              sx={{
                width: "100%",
                height: "100%",
                bgcolor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <PhotoCameraIcon sx={{ opacity: 0.8 }} />
            </Avatar>

            {/* icône “+” subtile (non cliquable tant que pas de person) */}
            <Tooltip title={nothingAllowed ? "Profil requis" : "Créer/choisir un profil pour ajouter une photo"}>
              <span>
                <IconButton
                  size="small"
                  disabled
                  sx={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    bgcolor: "rgba(0,0,0,0.55)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
                  }}
                >
                  <AddAPhotoRoundedIcon sx={{ color: "#fff" }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Stack spacing={0.5} alignItems="center" sx={{ textAlign: "center" }}>
            <Typography sx={{ fontWeight: 800 }}>{displayName}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Ajoute un profil pour apparaître dans le trombinoscope.
            </Typography>

            {hasApproval ? (
              <Chip size="small" icon={<InfoOutlinedIcon />} label="Validation possible" variant="outlined" />
            ) : null}
          </Stack>

          {nothingAllowed ? (
            <Chip
              icon={<LockRoundedIcon />}
              label="Action non autorisée — contacte un administrateur"
              variant="outlined"
            />
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: "100%", mt: 0.5 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddAPhotoRoundedIcon />}
                disabled={!isEnabled(createAction)}
                onClick={onCreate}
              >
                {getCtaLabel("Créer mon profil", createAction)}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonSearchRoundedIcon />}
                disabled={!isEnabled(pickAction)}
                onClick={onPick}
              >
                {getCtaLabel("Choisir un profil", pickAction)}
              </Button>
            </Stack>
          )}

          <Box sx={{ width: "100%", display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
            <Button variant="text" onClick={refreshProfile}>
              Rafraîchir
            </Button>
          </Box>
        </Stack>
      </Container>
    );
  }

  // --- Profil OK : avatar + actions photo ---
  return (
    <>
      {/* Zone Avatar + actions (dropzone cliquable) */}
      <Box
        {...getRootProps()}
        sx={{ display: "flex", justifyContent: "center", cursor: "pointer" }}
        onClick={(e) => {
          e.preventDefault();
          openDropzone();
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ position: "relative", width: 120, height: 120 }}>
          <Avatar alt={`Avatar de ${displayName}`} src={profileCurrentPhotoUrl} sx={{ width: "100%", height: "100%" }} />

          <Tooltip title="Changer la photo">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                openDropzone();
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
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

      {/* Lightbox Preview Photo */}
      <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, position: "relative" }}>
          <IconButton aria-label="actions" onClick={handleMenuOpen} sx={{ position: "absolute", right: 40, top: 8 }}>
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
          </Menu>
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center", pt: 0 }}>
          <Box
            component="img"
            src={profileCurrentPhotoUrl}
            alt={`Avatar de ${displayName}`}
            sx={{ maxWidth: "100%", maxHeight: "calc(70vh - 100px)", objectFit: "contain" }}
          />
        </DialogContent>

        <DialogActions sx={{ justifyContent: "flex-end", px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setLightboxOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Crop Modal Photo */}
      <Dialog open={cropModalOpen} onClose={() => setCropModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Recadrer votre photo</DialogTitle>
        <DialogContent>
          {rawFile && (
            <Box sx={{ position: "relative", width: "100%", height: 300, bgcolor: "#000" }}>
              <Cropper
                image={imageUrl || undefined}
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
            <Slider value={zoom} min={1} max={3} step={0.1} onChange={(_, v) => setZoom(v as number)} />

            <Typography gutterBottom>Rotation</Typography>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
              <IconButton onClick={() => setRotation((r) => r - 90)}>
                <RotateLeftIcon />
              </IconButton>
              <IconButton onClick={() => setRotation((r) => r + 90)}>
                <RotateRightIcon />
              </IconButton>
            </Box>
          </Box>

          {errorMsg && (
            <Typography color="error" sx={{ mt: 1 }}>
              {errorMsg}
            </Typography>
          )}
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

      {/* Dialog remplacement photo */}
      <Dialog open={confirmReplaceOpen} onClose={() => setConfirmReplaceOpen(false)}>
        <DialogTitle>Remplacer la photo en attente</DialogTitle>
        <DialogContent>
          <Typography>Une photo est déjà en attente de validation. Voulez-vous la remplacer ?</Typography>

          {pendingPhoto && (
            <img
              src={pendingPhoto.url}
              alt="Photo en attente"
              style={{ maxWidth: "100%", marginTop: 16, borderRadius: 8, border: "1px solid #ddd" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmReplaceOpen(false);
              setCropModalOpen(false);
              setRawFile(null);
              setImageUrl(null);
              setCroppedAreaPixels(null);
              setErrorMsg(null);
            }}
            color="inherit"
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              setConfirmReplaceOpen(false);
            }}
            color="error"
            variant="contained"
          >
            Remplacer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PhotoAvatarSection;
