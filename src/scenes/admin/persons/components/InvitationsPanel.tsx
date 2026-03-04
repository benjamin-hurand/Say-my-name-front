import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
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
  Tooltip,
  Typography,
} from "@mui/material";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";

import InviteDialog from "./InviteDialog";
import { PersonEmailDto } from "../../../../services/dto/person/admin/PersonEmailDto";
import { listInvitations, createInvitation, revokeInvitation, deleteInvitation } from "../../../../services/business/admin/invitations.service";
import { listPersonEmails } from "../../../../services/business/admin/personEmails.service";
import { InvitationDto, isInvitationExpired, CreateInvitationRequestDto } from "../../../../services/dto/person/admin/InvitationDto";
import { OrgRole } from "../../../../models/tenants/UserTenant";


type Props = {
  personId: number;
};

// Helpers
function randomHex(len = 48) {
  const bytes = new Uint8Array(len / 2);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const randomPin = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres

type DerivedStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

function deriveStatus(inv: InvitationDto): DerivedStatus {
  if (inv.acceptedAt) return "ACCEPTED";
  if (inv.revokedAt) return "REVOKED";
  if (isInvitationExpired(inv.expiresAt)) return "EXPIRED";
  return "PENDING";
}

const statusChip = (inv: InvitationDto) => {
  const s = deriveStatus(inv);
  switch (s) {
    case "ACCEPTED":
      return <Chip size="small" color="success" label="Acceptée" />;
    case "PENDING":
      return <Chip size="small" color="info" label="En attente" />;
    case "EXPIRED":
      return <Chip size="small" color="default" label="Expirée" />;
    case "REVOKED":
      return <Chip size="small" color="warning" label="Révoquée" />;
    default:
      return <Chip size="small" label={s} />;
  }
};

const InvitationsPanel: React.FC<Props> = ({ personId }) => {
  const [emails, setEmails] = useState<PersonEmailDto[]>([]);
  const [invites, setInvites] = useState<InvitationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [openInvite, setOpenInvite] = useState(false);

  const refresh = async () => {
    if (!personId) return;
    setLoading(true);
    setErr(null);
    try {
      const [es, is] = await Promise.all([listPersonEmails(personId), listInvitations()]);
      setEmails(es);
      setInvites(is);
    } catch (e: any) {
      setErr(e?.message || "Impossible de charger les invitations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  const personEmails = useMemo(() => new Set(emails.map((e) => e.email)), [emails]);

  // Affiche les invitations explicitement nominatives OU envoyées à une adresse de cette personne
  const personInvites = useMemo(
    () => invites.filter((inv) => inv.personId === personId || (inv.email ? personEmails.has(inv.email) : false)),
    [invites, personId, personEmails]
  );

  const canInvite = useMemo(() => emails.some((e) => e.active), [emails]);

  const handleSend = async (data: { email: string; role: OrgRole; locale: string; message?: string }) => {
    const constraints = JSON.stringify({
      locale: data.locale || "fr",
      message: data.message || undefined,
    });

    const payload: CreateInvitationRequestDto = {
      type: "EMAIL",
      label: null,
      note: null,
      constraintsJson: constraints,
      role: data.role || null,
      email: data.email || null,
      personId,
      expiresAt: null,
      maxUses: 1,
      rawToken: randomHex(64),
      rawPin: randomPin(),
    };

    await createInvitation(payload);
    await refresh();
  };

  const handleRevoke = async (id: number) => {
    await revokeInvitation(id);
    await refresh();
  };

  const handleDelete = async (id: number) => {
    await deleteInvitation(id);
    await refresh();
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h6">Invitations</Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          variant="contained"
          startIcon={<EmailRoundedIcon />}
          onClick={() => setOpenInvite(true)}
          disabled={!canInvite}
        >
          Inviter
        </Button>
      </Stack>

      {!canInvite && (
        <Alert severity="info">
          Ajoutez au moins un e-mail actif (idéalement primaire et vérifié) pour envoyer une invitation.
        </Alert>
      )}

      {err && (
        <Alert severity="error" onClose={() => setErr(null)}>
          {err}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small" aria-label="Historique des invitations">
          <TableHead>
            <TableRow>
              <TableCell>E-mail</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Statut</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {personInvites.map((inv) => {
              const canCancel = deriveStatus(inv) === "PENDING";
              return (
                <TableRow key={inv.id} hover>
                  <TableCell>{inv.email ?? "—"}</TableCell>
                  <TableCell>{inv.role ?? "—"}</TableCell>
                  <TableCell>{new Date(inv.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="center">{statusChip(inv)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Révoquer">
                        <span>
                          <IconButton size="small" onClick={() => handleRevoke(inv.id)} disabled={!canCancel}>
                            <CancelRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <span>
                          <IconButton size="small" onClick={() => handleDelete(inv.id)}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {personInvites.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 2, opacity: 0.7 }}>
                  Aucune invitation envoyée pour cette personne.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <InviteDialog open={openInvite} onClose={() => setOpenInvite(false)} emails={emails} onSend={handleSend} />
    </Stack>
  );
};

export default InvitationsPanel;
