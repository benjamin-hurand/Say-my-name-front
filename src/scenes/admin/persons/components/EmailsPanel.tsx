import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { alpha } from "@mui/material/styles";

import {
  PersonEmailDto,
  CreatePersonEmailRequestDto,
} from "../../../../services/dto/person/admin/PersonEmailDto";
import { listPersonEmails, createPersonEmail, setPrimaryEmail, updatePersonEmail, deletePersonEmail, markVerifiedEmail } from "../../../../services/business/admin/personEmails.service";


type Props = {
  personId: number;
};

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const EmailsPanel: React.FC<Props> = ({ personId }) => {
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<PersonEmailDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const refresh = async () => {
    if (!personId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPersonEmails(personId);
      setEmails(data);
    } catch (e: any) {
      setError(e?.message || "Impossible de charger les e-mails.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  const onAdd = async () => {
    const v = newEmail.trim();
    setAddError(null);
    if (!isEmail(v)) {
      setAddError("E-mail invalide.");
      return;
    }
    try {
      setAdding(true);
      const payload: CreatePersonEmailRequestDto = {
        email: v,
        kind: "WORK",          // défaut raisonnable
        sourceKind: "MANUAL",  // ajouté par admin
        sourceLabel: null,
        primary: emails.length === 0 ? true : null, // premier email -> primaire
      };
      await createPersonEmail(personId, payload);
      setNewEmail("");
      await refresh();
    } catch (e: any) {
      setAddError(e?.message || "Échec de l’ajout.");
    } finally {
      setAdding(false);
    }
  };

  const onSetPrimary = async (id: number) => {
    try {
      await setPrimaryEmail(personId, id);
    } finally {
      await refresh();
    }
  };

  const onToggleActive = async (id: number, active: boolean) => {
    try {
      await updatePersonEmail(personId, id, { active });
    } finally {
      await refresh();
    }
  };

  const onDelete = async (id: number, isPrimary: boolean) => {
    if (isPrimary && emails.length > 1) {
      setError("Vous ne pouvez pas supprimer l’e-mail primaire s’il existe d’autres e-mails. Définissez d’abord un autre e-mail comme primaire.");
      return;
    }
    try {
      await deletePersonEmail(personId, id);
    } finally {
      await refresh();
    }
  };

  const onMarkVerified = async (id: number) => {
    try {
      await markVerifiedEmail(personId, id);
    } finally {
      await refresh();
    }
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="h6">E-mails</Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          label="Nouvel e-mail"
          placeholder="prenom.nom@exemple.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          error={!!addError}
          helperText={addError || "Astuce : définissez un e-mail primaire pour les invitations."}
          sx={{ maxWidth: 420 }}
        />
        <Button
          size="small"
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onAdd}
          disabled={adding || !newEmail.trim()}
        >
          Ajouter
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small" aria-label="E-mails de la personne">
          <TableHead>
            <TableRow>
              <TableCell>E-mail</TableCell>
              <TableCell align="center">Statut</TableCell>
              <TableCell align="center">Primaire</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {emails.map((e) => {
              const verified = !!e.verifiedAt;
              return (
                <TableRow key={e.id} hover>
                  <TableCell sx={{ fontWeight: e.primary ? 600 : 400 }}>{e.email}</TableCell>
                  <TableCell align="center">
                    {e.active ? (
                      <Chip size="small" color={verified ? "success" : "default"} label={verified ? "Vérifié" : "Actif"} />
                    ) : (
                      <Chip size="small" color="warning" label="Désactivé" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {e.primary ? (
                      <Tooltip title="E-mail primaire">
                        <StarRoundedIcon fontSize="small" color="warning" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Définir comme primaire">
                        <IconButton size="small" onClick={() => onSetPrimary(e.id)}>
                          <StarBorderRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      {!verified && e.active && (
                        <Tooltip title="Marquer comme vérifié (admin)">
                          <span>
                            <IconButton size="small" onClick={() => onMarkVerified(e.id)}>
                              <MarkEmailReadRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                      <Tooltip title={e.active ? "Désactiver" : "Activer"}>
                        <span>
                          <IconButton size="small" onClick={() => onToggleActive(e.id, !e.active)}>
                            {e.active ? (
                              <ToggleOnRoundedIcon fontSize="small" color="success" />
                            ) : (
                              <ToggleOffRoundedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Supprimer">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onDelete(e.id, e.primary)}
                            sx={{ color: (t) => alpha(t.palette.error.main, 0.9) }}
                            disabled={loading}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {emails.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 2, opacity: 0.7 }}>
                  Aucun e-mail. Ajoutez une adresse pour pouvoir envoyer une invitation.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default EmailsPanel;
