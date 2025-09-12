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
} from "@mui/material";
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  PhotoCamera as PhotoCameraIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  ZoomOutMap as ZoomIcon,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";

import { useProfile } from "../../../contexts/ProfileContext";
import { Photo } from "../../../models/commons/Photo";
import { submitPhotoForApproval } from "../../../services/business/photos/photo.service";
import { notifyError, notifySuccess } from "../../../services/notification/toast.service";
import getCroppedImg from "../../../utils/getCroppedImg";
import { getApiErrorMessage } from "../../../utils/apiError"; // ⬅️ NEW

const MIN_UPLOAD_SIZE = 1024 * 1; // 1 KB
const MAX_UPLOAD_SIZE = 1024 * 1024 * 5; // 5 MB

const PhotoAvatarSection: React.FC = () => {
  const { user, profile, loading, refreshProfile, setProfile } = useProfile();

  const username = user?.username ?? "Moi";
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
      // on ouvre le cropper ; l'annulation fermera et resettera l'input
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
      // 1) crée l'image recadrée côté client
      const blob = await getCroppedImg(imageUrl, croppedAreaPixels, rotation);
      const mime = (blob as any).type || rawFile.type || "image/jpeg";
      const fileToSend = new File([blob], rawFile.name || `photo-${Date.now()}.jpg`, { type: mime });

      // 2) envoie au back — retourne la nouvelle Photo (status = PENDING)
      const newPhoto = await submitPhotoForApproval(profile.id, fileToSend);

      // 3) patch local ciblé : remplace la PENDING existante ou ajoute la nouvelle
      setProfile((prev) => {
        if (!prev) return prev;
        const alreadyPending = prev.photos.find((p) => p.status === "PENDING");
        const updatedPhotos = alreadyPending
          ? prev.photos.map((p) => (p.status === "PENDING" ? newPhoto : p))
          : [...prev.photos, newPhoto];
        return { ...prev, photos: updatedPhotos };
      });

      // 4) reset UI
      setCropModalOpen(false);
      setRawFile(null);
      setZoom(1);
      setRotation(0);
      setConfirmReplaceOpen(false);
      setPendingPhoto(null);

      notifySuccess("Photo soumise à vérification !");
    } catch (err: any) {
      const msg = getApiErrorMessage(err, "Erreur lors de la soumission de la photo."); // ⬅️ NEW
      setErrorMsg(msg);
      notifyError(msg);
    } finally {
      setUploading(false);
    }
  };

  // --- Loading / profil indisponible : UX locale
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Typography color="text.secondary">Profil indisponible pour l’instant.</Typography>
        <Box sx={{ mt: 2, textAlign: "right" }}>
          <Button variant="contained" onClick={refreshProfile}>
            Réessayer
          </Button>
        </Box>
      </Container>
    );
  }

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
          <Avatar alt={`Avatar de ${username}`} src={profileCurrentPhotoUrl} sx={{ width: "100%", height: "100%" }} />
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
          <IconButton aria-label="close" onClick={() => setLightboxOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
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
            alt={`Avatar de ${username}`}
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
              // Annuler complètement : ferme la confirmation + le cropper et reset le fichier
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
              // Continuer : on ferme juste la confirmation et on laisse l'utilisateur recadrer puis "Valider"
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
