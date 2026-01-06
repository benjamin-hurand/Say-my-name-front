import dayjs from "dayjs";
import "dayjs/locale/fr";          // << ajoute cette ligne
dayjs.locale("fr");
import React, { useEffect, useMemo, useRef, useState } from "react";

import { useOrgData } from "../../../../contexts/OrgDataContext";
import { useProfile } from "../../../../contexts/ProfileContext";
import { Attribute } from "../../../../models/commons/Attribute/Attribute";
import { PersonAttribute } from "../../../../models/commons/PersonAttribute";
import { saveAttributeChanges } from "../../../../services/business/profile/profile.service";
import { notifyError, notifySuccess } from "../../../../services/notification/toast.service";
import AttributesList from "./AttributesList";
import ChangeRequestDialog from "./dialogs/ProfileChangeRequestCreationDialog";
import { submitChangeRequest } from "../../../../services/business/change-requests/change-requests.service";
import { SubmitChangeRequestDto, SubmitChangeRequestItemDto } from "../../../../services/dto/ChangeRequestsDto";
import { useOptimisticPersonAttributes } from "./useOptimisticPersonAttributes";

import {
  ChangeRequestSummary,
} from "../../../../models/commons/Profile/ChangeRequest";

import ChangeRequestViewerDialog from "./dialogs/ProfileChangeRequestViewerDialog";

const AttributesListContainer: React.FC = () => {
  const allAttributes = (useOrgData().attributes ?? []) as Attribute[];
  const { profile, changeRequests, refreshProfile } = useProfile();
  const rawAttributes = (profile?.attributes ?? []) as PersonAttribute[];

  // Hook overlay optimiste
  const { profileAttributes, applyOptimisticDelta, replaceAttrValues, revertAttrOverride } =
    useOptimisticPersonAttributes(rawAttributes);

  // --- Modale “Créer une demande …”
  const [crModalOpen, setCrModalOpen] = useState(false);
  const [crAttr, setCrAttr] = useState<Attribute | null>(null);
  const [crPaCandidates, setCrPaCandidates] = useState<{ id: number; value: string }[] | undefined>(undefined);

  // --- Modale “Voir / éditer / annuler une demande existante”
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedCr, setSelectedCr] = useState<ChangeRequestSummary | null>(null);
  const [viewerAttr, setViewerAttr] = useState<Attribute | null>(null);
  const [viewerChips, setViewerChips] = useState<{ id: number; value: string }[]>([]);

  // --- Inline edit states (pour l’édition directe dans la liste)
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingAttrId, setEditingAttrId] = useState<number | null>(null);
  const [editingPaId, setEditingPaId] = useState<number | null>(null);
  const [editingOriginalValue, setEditingOriginalValue] = useState<string>("");
  const [attrValue, setAttrValue] = useState<string>("");

  type RowStatus = "idle" | "saving" | "success" | "error";
  const [statusByKey, setStatusByKey] = useState<Record<string, RowStatus>>({});

  const editInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (editInputRef.current) editInputRef.current.focus();
  }, [editingKey]);

  const SUCCESS_HOLD_MS = 600;

  // Helpers
  const normalizeValue = (val: string) => (val ?? "").trim().replace(/\s+/g, " ");
  const setStatus = (key: string, status: RowStatus) =>
    setStatusByKey((prev) => ({ ...prev, [key]: status }));

  const safePolicy = (attrDef: Attribute) => attrDef?.editPolicy ?? "FREE";
  const canEdit = (attrDef: Attribute) => safePolicy(attrDef) === "FREE";
  const canDelete = (attrDef: Attribute, currentCount: number) => {
    if (safePolicy(attrDef) === "RESTRICTED") return false;
    if (attrDef.required && currentCount <= 1) return false;
    return true;
  };

  // --- Edition “historique”
  const saveCurrentEditIfNeeded = async () => {
    if (!editingKey || editingAttrId === null) return;

    const newValNorm = normalizeValue(attrValue);
    const origValNorm = normalizeValue(editingOriginalValue);

    if (!newValNorm || newValNorm === origValNorm) {
      setEditingKey(null);
      setEditingAttrId(null);
      setEditingPaId(null);
      setAttrValue("");
      setEditingOriginalValue("");
      return;
    }

    const attrId = editingAttrId;

    setStatus(editingKey, "saving");
    try {
      if (editingPaId == null) {
        applyOptimisticDelta(attrId, { added: [{ value: newValNorm }] });
      } else {
        applyOptimisticDelta(attrId, { updated: [{ id: editingPaId, value: newValNorm }] });
      }

      const resp = await saveAttributeChanges(profile!.id, attrId, {
        create: editingPaId == null ? [{ value: newValNorm }] : [],
        update: editingPaId != null ? [{ id: editingPaId, value: newValNorm }] : [],
        delete: [],
      });

      replaceAttrValues(resp.attributeId, resp.values);

      setStatus(editingKey, "success");
      await new Promise((res) => setTimeout(res, SUCCESS_HOLD_MS));
    } catch {
      if (editingAttrId != null) revertAttrOverride(editingAttrId);
      setStatus(editingKey, "error");
      await new Promise((res) => setTimeout(res, SUCCESS_HOLD_MS));
    } finally {
      setEditingKey(null);
      setEditingAttrId(null);
      setEditingPaId(null);
      setAttrValue("");
      setEditingOriginalValue("");
      setStatus(editingKey, "idle");
    }
  };

  const handleStartEdit = async (
    rowKey: string,
    attributeId: number,
    personAttributeId: number | null,
    currentValue: string
  ) => {
    if (editingKey && editingKey !== rowKey) {
      await saveCurrentEditIfNeeded();
    }
    setEditingKey(rowKey);
    setEditingAttrId(attributeId);
    setEditingPaId(personAttributeId);
    setEditingOriginalValue(currentValue || "");
    setAttrValue(currentValue || "");
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingAttrId(null);
    setEditingPaId(null);
    setAttrValue("");
    setEditingOriginalValue("");
  };

  // --- Change Requests (création)
  const openChangeRequestModal = (attr: Attribute, rowValues: { id: number; value: string }[]) => {
    setCrAttr(attr);
    setCrPaCandidates(rowValues);
    setCrModalOpen(true);
  };
  const closeChangeRequestModal = () => setCrModalOpen(false);

  const handleSubmitChangeRequest = async (payload: {
    attributeId: number;
    added: { value: string }[];
    updated: { id: number; value: string }[];
    deleted: { id: number }[];
    globalReason: string;
  }) => {
    try {
      const items: SubmitChangeRequestItemDto[] = [];
      // IMPORTANT: l'attribut est au niveau ENVELOPPE, donc on ne le met plus sur les items
      for (const a of payload.added) items.push({ action: "CREATE", proposedValue: a.value });
      for (const u of payload.updated) items.push({ action: "UPDATE", personAttributeId: u.id, proposedValue: u.value });
      for (const d of payload.deleted) items.push({ action: "DELETE", personAttributeId: d.id });

      const req: SubmitChangeRequestDto = {
        personId: profile!.id,
        attributeId: payload.attributeId, // <<---- NOUVEAU: au niveau enveloppe
        requestReason: payload.globalReason.trim(),
        items,
      };

      await submitChangeRequest(req);
      notifySuccess("Votre demande a été envoyée.");
      await refreshProfile();
    } catch (e: any) {
      notifyError(e?.response?.data?.message || "Échec de l’envoi de la demande de modification.");
      throw e;
    }
  };

  // --- Ouvrir une CR existante (viewer)
  const handleOpenExistingChangeRequest = (crId: number) => {
    const cr = (changeRequests ?? []).find((c) => c.id === crId);
    if (!cr) return;

    // Désormais l'attribut ciblé est porté par l'enveloppe
    const targetAttrId: number | null = (cr as any).attributeId ?? null;
    if (!targetAttrId) return;

    const attr = allAttributes.find((a) => a.id === targetAttrId) ?? null;
    setViewerAttr(attr);

    // chips actuels (profil) pour cet attribut
    const chips = (rawAttributes ?? [])
      .filter((pa) => pa.attributeId === targetAttrId && !pa.pendingDelete)
      .map((pa) => ({ id: pa.id, value: pa.value }));

    setViewerChips(chips);
    setSelectedCr(cr);
    setViewerOpen(true);
  };

  // --- callbacks viewer
  const handleViewerClosed = () => setViewerOpen(false);

  const handleCrResubmitted = async () => {
    await refreshProfile();
  };

  const handleCrCanceled = async () => {
    await refreshProfile();
  };

  // --- Formatage
  const formatDisplayValue = (type: string | null | undefined, value: string) => {
    if (!value) return "";
    const t = (type ?? "").toString().toUpperCase();
    const d = dayjs(value);
    if (!d.isValid()) return value;

    if (t === "DATE") {
      // 26/09/1999
      return d.format("DD/MM/YYYY");
    }
    if (t === "DATETIME") {
      // 26/09/1999 13:45 (24h)
      return d.format("DD/MM/YYYY HH:mm");
    }
    if (t === "BOOLEAN") {
      return value === "true" ? "Oui" : value === "false" ? "Non" : value;
    }
    return value;
  };

  // === handlers ligne (bulk)
  const handleRowSaveBulk = async (payload: {
    attributeId: number;
    added: { value: string }[];
    updated: { id: number; value: string }[];
    deleted: { id: number }[];
  }) => {
    const { attributeId, added, updated, deleted } = payload;

    try {
      applyOptimisticDelta(attributeId, { added, updated, deleted });
      const resp = await saveAttributeChanges(profile!.id, attributeId, { create: added, update: updated, delete: deleted });
      replaceAttrValues(resp.attributeId, resp.values);
      notifySuccess("Modifications enregistrées.");
    } catch (e: any) {
      revertAttrOverride(attributeId);
      notifyError(e?.response?.data?.message || "Échec de l'enregistrement des modifications.");
    }
  };

  const handleRowCancelBulk = () => {};

  return (
    <>
      <AttributesList
        allAttributes={allAttributes}
        profileAttributes={profileAttributes as any}
        editingKey={editingKey}
        statusByKey={statusByKey}
        attrValue={attrValue}
        inputRef={editInputRef}
        onChangeAttrValue={setAttrValue}
        canEdit={canEdit}
        canDelete={canDelete}
        formatDisplayValue={formatDisplayValue}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onOpenChangeRequest={openChangeRequestModal}
        onRowSave={handleRowSaveBulk}
        onRowCancel={handleRowCancelBulk}
        // Passe les enveloppes & callback pour ouvrir le viewer
        changeRequests={changeRequests ?? []}
        onOpenExistingChangeRequest={handleOpenExistingChangeRequest}
      />

      {/* Création d'une nouvelle demande */}
      <ChangeRequestDialog
        open={crModalOpen}
        attr={crAttr}
        onClose={closeChangeRequestModal}
        formatDisplayValue={formatDisplayValue}
        chips={crPaCandidates ?? []}
        onSubmit={handleSubmitChangeRequest}
        requireGlobalReason={true}
      />

      {/* Lecture / édition / annulation d'une demande existante */}
      <ChangeRequestViewerDialog
        open={viewerOpen}
        personId={profile?.id!}
        cr={selectedCr}
        attr={viewerAttr}
        currentChips={viewerChips}
        onClose={handleViewerClosed}
        onResubmitted={handleCrResubmitted}
        onCanceled={handleCrCanceled}
        formatDisplayValue={formatDisplayValue}
      />
    </>
  );
};

export default AttributesListContainer;
