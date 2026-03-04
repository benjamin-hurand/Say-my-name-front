import React, { useMemo, useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { PersonEmailDto } from "../../../../services/dto/person/admin/PersonEmailDto";
import { OrgRole } from "../../../../models/tenants/UserTenant";

type Props = {
  open: boolean;
  onClose: () => void;
  emails: PersonEmailDto[];
  onSend: (data: { email: string; role: OrgRole; locale: string; message?: string }) => Promise<void> | void;
};

const InviteDialog: React.FC<Props> = ({ open, onClose, emails, onSend }) => {
  const activeEmails = useMemo(() => emails.filter(e => e.active), [emails]);

  const defaultEmail = useMemo(() => {
    return (
      emails.find((e) => e.primary && !!e.verifiedAt)?.email ||
      emails.find((e) => e.primary)?.email ||
      activeEmails[0]?.email ||
      ""
    );
  }, [emails, activeEmails]);

  const [email, setEmail] = useState<string>(defaultEmail);
  const [customEmailMode, setCustomEmailMode] = useState<boolean>(false);

  const [role, setRole] = useState<OrgRole>("VIEWER");
  const [locale, setLocale] = useState<string>("fr");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setCustomEmailMode(!defaultEmail); // si pas d’email dispo → mode saisie
      setRole("VIEWER");
      setLocale("fr");
      setMessage("");
    }
  }, [open, defaultEmail]);

  const canSend = !!email?.trim();

  const submit = async () => {
    await onSend({ email: email.trim(), role, locale, message: message?.trim() || undefined });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Envoyer une invitation</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {/* Choix / saisie d'email */}
          {!customEmailMode && activeEmails.length > 0 ? (
            <TextField
              select
              label="E-mail"
              value={email}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__custom__") {
                  setCustomEmailMode(true);
                  setEmail("");
                } else {
                  setEmail(v);
                }
              }}
              helperText="Choisissez l'adresse à utiliser ou saisissez-en une autre."
            >
              {activeEmails.map((e) => (
                <MenuItem key={e.id} value={e.email}>
                  {e.email} {e.primary ? "• primaire" : ""} {!!e.verifiedAt ? "• vérifié" : ""}
                </MenuItem>
              ))}
              <MenuItem value="__custom__">Saisir une autre adresse…</MenuItem>
            </TextField>
          ) : (
            <TextField
              type="email"
              label="E-mail destinataire"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@exemple.com"
              helperText={activeEmails.length ? "Vous pouvez aussi sélectionner un e-mail existant." : "Saisissez l’adresse à inviter."}
            />
          )}

          {/* Rôle & Langue */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Rôle"
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
              sx={{ flex: 1 }}
            >
              <MenuItem value="VIEWER">Lecteur (VIEWER)</MenuItem>
              <MenuItem value="EDITOR">Éditeur (EDITOR)</MenuItem>
              <MenuItem value="ADMIN">Admin (ADMIN)</MenuItem>
              <MenuItem value="OWNER">Propriétaire (OWNER)</MenuItem>
            </TextField>

            <TextField
              select
              label="Langue"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              sx={{ flex: 1 }}
            >
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </TextField>
          </Stack>

          {/* Message optionnel */}
          <TextField
            label="Message (optionnel)"
            multiline
            minRows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Un petit mot d'accompagnement…"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" disabled={!canSend} onClick={submit}>
          Envoyer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteDialog;
