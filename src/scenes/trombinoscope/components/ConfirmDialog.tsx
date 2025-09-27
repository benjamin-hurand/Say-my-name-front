import React from "react";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";

type Props = {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
};
const ConfirmDialog: React.FC<Props> = ({ open, title, message, onCancel, onConfirm, confirmLabel = "Confirmer" }) => (
  <Dialog open={open} onClose={onCancel}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Annuler</Button>
      <Button onClick={onConfirm} autoFocus variant="contained">{confirmLabel}</Button>
    </DialogActions>
  </Dialog>
);
export default ConfirmDialog;
