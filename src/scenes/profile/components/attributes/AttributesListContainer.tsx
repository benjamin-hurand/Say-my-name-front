import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";

import { useGlobalData } from "../../../../contexts/GlobalDataContext";
import { useProfile } from "../../../../contexts/ProfileContext";
import { saveAttributeChanges } from "../../../../services/business/profile/profile.service";
import { cancelChangeRequest, submitChangeRequest } from "../../../../services/business/change-requests/change-requests.service";
import { notifyError, notifySuccess } from "../../../../services/notification/toast.service";
import AttributesList from "./AttributesList";
import ChangeRequestDialog from "./dialogs/ChangeRequestDialog";
import AttributeActionMenu from "./menus/AttributeActionMenu";
import { PersonAttributeFull, statusRank } from "../../../../models/commons/PersonAttribute";
import { Attribute } from "../../../../models/commons/Attribute";
import { buildCreateRequest, buildUpdateRequest, buildDeleteRequest } from "../../../../services/business/change-requests/changeRequests.builders";
import { ChangeRequestDto } from "../../../../services/dto/ChangeRequestsDto";

type ChangeAction = "UPDATE" | "DELETE" | "CREATE";

interface ChangeRequestLocal {
  id: number;
  action: ChangeAction;
  attributeId: number;
  personAttributeId?: number | null;
}

const AttributesListContainer: React.FC = () => {
  const allAttributes = (useGlobalData().attributes ?? []) as Attribute[];
  const { profile, refreshProfile } = useProfile();
  const rawAttributes = (profile?.attributes ?? []) as PersonAttributeFull[];

  // 1) masque pending_delete
  // 2) tri: ACTIVE (0) puis FUTURE (1) — (EXPIRED si jamais au flux)
  const profileAttributes = rawAttributes
    .filter((pa) => !pa.pendingDelete)
    .sort((a, b) => statusRank(a) - statusRank(b));

  // --- Modale “Demander …”
  const [crModalOpen, setCrModalOpen] = useState(false);
  const [crMode, setCrMode] = useState<ChangeAction>("UPDATE");
  const [crAttr, setCrAttr] = useState<Attribute | null>(null);
  const [crPaId, setCrPaId] = useState<number | null>(null);
  const [crOriginalValue, setCrOriginalValue] = useState<string>("");
  const [crProposedValue, setCrProposedValue] = useState<string>("");
  const [crReason, setCrReason] = useState<string>("");
  const [crSubmitting, setCrSubmitting] = useState(false);

  // Pending par clé ("pa-<id>" / "add-<attrId>")
  const [pendingByKey, setPendingByKey] =
    useState<Record<string, ChangeRequestLocal>>({});

  // Menu contextuel
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);
  const [actionMenuData, setActionMenuData] = useState<{
    key: string;
    attr: Attribute;
    paId: number | null;
    currentValue: string;
    canRequestUpdate: boolean;
    canRequestDelete: boolean;
    canRequestCreate?: boolean;
    rowValues?: { id: number; value: string }[];
  } | null>(null);

  const openActionMenu = (
    e: React.MouseEvent<HTMLElement>,
    key: string,
    attr: Attribute,
    paId: number | null,
    currentValue: string,
    canRequestUpdate: boolean,
    canRequestDelete: boolean,
    canRequestCreate?: boolean,
    rowValues?: { id: number; value: string }[]
  ) => {
    e.stopPropagation();
    setActionMenuAnchor(e.currentTarget);
    setActionMenuData({
      key,
      attr,
      paId,
      currentValue,
      canRequestUpdate,
      canRequestDelete,
      canRequestCreate: !!canRequestCreate,
      rowValues,
    });
  };
  const closeActionMenu = () => {
    setActionMenuAnchor(null);
    setActionMenuData(null);
  };

  // State pour la modale "Demander ..."
  const [crPaCandidates, setCrPaCandidates] = useState<{ id: number; value: string }[] | undefined>(undefined);
  const [crSelectedPaId, setCrSelectedPaId] = useState<number | null>(null);

  // --- Inline edit states
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

  // Helpers/guards
  const normalizeValue = (val: string) => (val ?? "").trim().replace(/\s+/g, " ");
  const normalizeForCompare = (type: string | null | undefined, raw: string) => {
    const base = normalizeValue(raw || ""); // trim + collapse spaces
    const t = (type ?? "").toString().toUpperCase();

    if (!base) return "";

    switch (t) {
      case "NUMBER": {
        // accepte 12,34 ou 12.34 -> "12.34"
        const normalized = base.replace(",", ".");
        const n = Number(normalized);
        return Number.isNaN(n) ? base.toLowerCase() : String(n);
      }
      case "DATE": {
        const d = dayjs(base);
        return d.isValid() ? d.format("YYYY-MM-DD") : base.toLowerCase();
      }
      case "DATETIME": {
        const d = dayjs(base);
        // format court sans secondes pour rester cohérent avec ton affichage
        return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : base.toLowerCase();
      }
      case "BOOLEAN": {
        const b = base.toLowerCase();
        if (b === "true" || b === "oui" || b === "1") return "true";
        if (b === "false" || b === "non" || b === "0") return "false";
        return b;
      }
      case "EMAIL":
      case "URL":
      case "TEXT":
      default:
        // texte-like : insensible à la casse
        return base.toLowerCase();
    }
  };
  const setStatus = (key: string, status: RowStatus) =>
    setStatusByKey((prev) => ({ ...prev, [key]: status }));

  const safePolicy = (attrDef: Attribute) => attrDef?.editPolicy ?? "FREE";
  const canEdit = (attrDef: Attribute) => safePolicy(attrDef) === "FREE";
  const canDelete = (attrDef: Attribute, currentCount: number) => {
    if (safePolicy(attrDef) === "RESTRICTED") return false;
    if (attrDef.required && currentCount <= 1) return false;
    return true;
  };

  // Helper: retrouver attributeId depuis un personAttributeId (si besoin)
  const findAttributeIdByPaId = (paId: number | null | undefined): number | null => {
    if (paId == null) return null;
    const found = (profileAttributes as PersonAttributeFull[]).find((pa) => pa?.id === paId);
    return found?.attribute?.id ?? null;
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

    setStatus(editingKey, "saving");
    try {
      if (editingPaId == null) {
        await saveAttributeChanges(profile!.id, editingAttrId, {
          create: [{ value: attrValue }],
          update: [],
          delete: [],
        });
      } else {
        await saveAttributeChanges(profile!.id, editingAttrId, {
          create: [],
          update: [{ id: editingPaId, value: attrValue }],
          delete: [],
        });
      }
      await refreshProfile();
      setStatus(editingKey, "success");
      await new Promise((res) => setTimeout(res, SUCCESS_HOLD_MS));
    } catch {
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

  const handleBlurRow = async (
    rowKey: string,
    attributeId: number,
    personAttributeId: number | null,
    originalValue: string
  ) => {
    if (editingKey !== rowKey) return;

    const newValNorm = normalizeValue(attrValue);
    const origValNorm = normalizeValue(originalValue);
    if (!newValNorm || newValNorm === origValNorm) {
      setEditingKey(null);
      setEditingAttrId(null);
      setEditingPaId(null);
      setAttrValue("");
      setEditingOriginalValue("");
      return;
    }

    setStatus(rowKey, "saving");
    try {
      if (personAttributeId == null) {
        await saveAttributeChanges(profile!.id, attributeId, {
          create: [{ value: attrValue }],
          update: [],
          delete: [],
        });
      } else {
        await saveAttributeChanges(profile!.id, attributeId, {
          create: [],
          update: [{ id: personAttributeId, value: attrValue }],
          delete: [],
        });
      }
      await refreshProfile();
      setStatus(rowKey, "success");
    } catch {
      setStatus(rowKey, "error");
    } finally {
      await new Promise((res) => setTimeout(res, SUCCESS_HOLD_MS));
      setEditingKey(null);
      setEditingAttrId(null);
      setEditingPaId(null);
      setAttrValue("");
      setEditingOriginalValue("");
      setStatus(rowKey, "idle");
    }
  };

  const handleManualSave = async (
    rowKey: string,
    attributeId: number,
    personAttributeId: number | null
  ) => {
    if (editingKey !== rowKey) return;
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

    setStatus(rowKey, "saving");
    try {
      if (personAttributeId == null) {
        await saveAttributeChanges(profile!.id, attributeId, {
          create: [{ value: attrValue }],
          update: [],
          delete: [],
        });
      } else {
        await saveAttributeChanges(profile!.id, attributeId, {
          create: [],
          update: [{ id: personAttributeId, value: attrValue }],
          delete: [],
        });
      }
      await refreshProfile();
      setStatus(rowKey, "success");
    } catch {
      setStatus(rowKey, "error");
    } finally {
      await new Promise((res) => setTimeout(res, SUCCESS_HOLD_MS));
      setEditingKey(null);
      setEditingAttrId(null);
      setEditingPaId(null);
      setAttrValue("");
      setEditingOriginalValue("");
      setStatus(rowKey, "idle");
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingAttrId(null);
    setEditingPaId(null);
    setAttrValue("");
    setEditingOriginalValue("");
  };

  const handleDeleteValue = async (personAttributeId: number) => {
    try {
      const attributeId = findAttributeIdByPaId(personAttributeId);
      if (attributeId == null) {
        notifyError("Impossible de déterminer l’attribut à supprimer.");
        return;
      }
      await saveAttributeChanges(profile!.id, attributeId, {
        create: [],
        update: [],
        delete: [{ id: personAttributeId }],
      });
      await refreshProfile();
      notifySuccess("Valeur programmée pour suppression (fin de saison).");
    } catch {
      notifyError("Échec de la suppression.");
    }
  };

  // --- Change Requests

  const openChangeRequestModal = (
    mode: ChangeAction,
    attr: Attribute,
    personAttributeId: number | null,
    currentValue: string,
    paCandidates?: { id: number; value: string }[]
  ) => {
    setCrMode(mode);
    setCrAttr(attr);

    setCrPaCandidates(paCandidates);
    let initialPaId = personAttributeId ?? null;

    if (initialPaId == null && paCandidates && paCandidates.length > 0) {
      initialPaId = paCandidates[0].id;
    }

    setCrPaId(initialPaId);
    setCrSelectedPaId(initialPaId);

    const selectedValue =
      initialPaId != null
        ? paCandidates?.find((c) => c.id === initialPaId)?.value ?? currentValue
        : currentValue;

    setCrOriginalValue(selectedValue || "");
    setCrProposedValue(mode === "UPDATE" ? selectedValue || "" : "");
    setCrReason("");
    setCrModalOpen(true);
  };
  const closeChangeRequestModal = () => {
    setCrModalOpen(false);
    setCrSubmitting(false);
  };

  // ⬇️ ICI : ton handler de sélection dans la modale
  const handleChangeSelectedPa = (newId: number | null) => {
    setCrSelectedPaId(newId);
    setCrPaId(newId);

    if (!crPaCandidates) return;
    const v =
      crPaCandidates.find((c) => c.id === newId || newId == null)?.value ?? "";
    setCrOriginalValue(v);
    if (crMode === "UPDATE") {
      setCrProposedValue(v); // ou "" si tu préfères forcer la saisie
    }
  };

  const handleSubmitChangeRequest = async () => {
    if (!crAttr) return;

    // validations
    if (!crReason.trim()) {
      notifyError("Merci d'indiquer un motif.");
      return;
    }
    if ((crMode === "UPDATE" || crMode === "CREATE") && !crProposedValue.trim()) {
      notifyError(crMode === "CREATE"
        ? "Merci de proposer la valeur à ajouter."
        : "Merci de proposer une nouvelle valeur.");
      return;
    }
    if ((crMode === "UPDATE" || crMode === "DELETE") && (crPaCandidates?.length ?? 0) > 0 && !crPaId) {
      notifyError("Merci de choisir la valeur à cibler.");
      return;
    }
    if (crMode === "UPDATE") {
      const origNorm = normalizeForCompare(crAttr.type, crOriginalValue);
      const propNorm = normalizeForCompare(crAttr.type, crProposedValue);
      if (origNorm === propNorm) {
        notifyError("Aucun changement réel détecté après normalisation (casse/espaces/types).");
        return;
      }
    }

    try {
      setCrSubmitting(true);

      let payload;
      if (crMode === "CREATE") {
        payload = buildCreateRequest(profile!.id, crAttr.id, crProposedValue, crReason);
      } else if (crMode === "UPDATE") {
        payload = buildUpdateRequest(profile!.id, crAttr.id, crPaId!, crProposedValue, crReason);
      } else {
        payload = buildDeleteRequest(profile!.id, crAttr.id, crPaId!, crReason);
      }

      const res: ChangeRequestDto = await submitChangeRequest(payload);

      const key = crPaId ? `pa-${crPaId}` : `add-${crAttr.id}`;
      setPendingByKey((prev) => ({
        ...prev,
        [key]: {
          id: res.id,
          action: crMode,
          attributeId: crAttr.id,
          personAttributeId: crPaId ?? undefined,
        },
      }));

      // recharge pour afficher les CR au bon endroit (person vs PA)
      await refreshProfile();
      notifySuccess("Demande envoyée. En attente de validation.");
      closeChangeRequestModal();
    } catch (e: any) {
      notifyError(e?.response?.data?.message || "Échec de création de la demande.");
      setCrSubmitting(false);
    }
  };

  const handleCancelChangeRequest = async (key: string) => {
    const req = pendingByKey[key];
    if (!req) return;
    try {
      await cancelChangeRequest(req.id); // ← appelle le service dédié
      setPendingByKey((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      await refreshProfile();
      notifySuccess("Demande annulée.");
    } catch (e: any) {
      notifyError(e?.response?.data?.message || "Échec de l'annulation de la demande.");
    }
  };


  // --- Formatage
  const formatDisplayValue = (type: string | null | undefined, value: string) => {
    if (!value) return "";
    const t = (type ?? "").toString().toUpperCase();
    if (t === "DATE") {
      const d = dayjs(value);
      return d.isValid() ? d.format("YYYY-MM-DD") : value;
    }
    if (t === "DATETIME") {
      const d = dayjs(value);
      return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : value;
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
    try {
      await saveAttributeChanges(profile!.id, payload.attributeId, {
        create: payload.added,
        update: payload.updated,
        delete: payload.deleted,
      });
      await refreshProfile();
      notifySuccess("Modifications enregistrées.");
    } catch (e: any) {
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
        pendingByKey={pendingByKey}
        onCancelChangeRequest={handleCancelChangeRequest}
        onStartEdit={handleStartEdit}
        onManualSave={handleManualSave}
        onCancelEdit={handleCancelEdit}
        onBlurRow={handleBlurRow}
        onDeleteValue={handleDeleteValue}
        onOpenMenu={openActionMenu}
        onRowSave={handleRowSaveBulk}
        onRowCancel={handleRowCancelBulk}
      />

      {/* Dialog “Demander …” */}
      <ChangeRequestDialog
        open={crModalOpen}
        mode={crMode}
        attr={crAttr}
        originalValue={crOriginalValue}
        proposedValue={crProposedValue}
        reason={crReason}
        submitting={crSubmitting}
        onClose={closeChangeRequestModal}
        onSubmit={handleSubmitChangeRequest}
        onChangeProposed={setCrProposedValue}
        onChangeReason={setCrReason}
        formatDisplayValue={formatDisplayValue}
        // NEW ↓
        paCandidates={crPaCandidates}
        selectedPaId={crSelectedPaId}
        onChangeSelectedPaId={handleChangeSelectedPa}
      />

      {/* Menu contextuel “Demander …” */}
      <AttributeActionMenu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={closeActionMenu}
        canRequestUpdate={!!actionMenuData?.canRequestUpdate}
        canRequestDelete={!!actionMenuData?.canRequestDelete}
        canRequestCreate={!!actionMenuData?.canRequestCreate}
        onRequestUpdate={() => {
          if (!actionMenuData) return;
          openChangeRequestModal(
            "UPDATE",
            actionMenuData.attr,
            actionMenuData.paId,
            actionMenuData.currentValue,
            actionMenuData.rowValues
          );
        }}
        onRequestDelete={() => {
          if (!actionMenuData) return;
          openChangeRequestModal(
            "DELETE",
            actionMenuData.attr,
            actionMenuData.paId,
            actionMenuData.currentValue,
            actionMenuData.rowValues
          );
        }}
        onRequestCreate={() => {
          if (!actionMenuData) return;
          openChangeRequestModal("CREATE", actionMenuData.attr, null, "");
        }}
      />
    </>
  );
};

export default AttributesListContainer;
