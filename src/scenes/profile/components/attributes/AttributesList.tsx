import React from "react";
import { Stack, Divider } from "@mui/material";
import AttributeRow, { RowStatus } from "./rows/AttributeRow";
import { Attribute } from "../../../../models/commons/Attribute";
import { PersonAttributeFull } from "../../../../models/commons/PersonAttribute";

type ChangeRequestLocal = {
  id: number;
  action: "UPDATE" | "DELETE" | "CREATE";
  attributeId: number;
  personAttributeId?: number | null;
};

type Props = {
  allAttributes: Attribute[];
  profileAttributes: PersonAttributeFull[]; // ⬅️ full du back

  editingKey: string | null;
  statusByKey: Record<string, RowStatus>;
  attrValue: string;
  inputRef: React.Ref<any>;
  onChangeAttrValue: (v: string) => void;

  canEdit: (attrDef: Attribute) => boolean;
  canDelete: (attrDef: Attribute, currentCount: number) => boolean;
  formatDisplayValue: (type: string | null | undefined, value: string) => string;

  pendingByKey: Record<string, ChangeRequestLocal>;
  onCancelChangeRequest: (key: string) => void;

  onStartEdit: (rowKey: string, attributeId: number, paId: number | null, currentValue: string) => void;
  /** Ancienne sauvegarde "manuelle" au niveau valeur unique — plus utilisée avec le composant unifié */
  onManualSave: (rowKey: string, attributeId: number, paId: number | null) => void;
  onCancelEdit: () => void;

  /** Ancien blur par ligne unique — non utilisé par AttributeRow (pas d'auto-save au blur) */
  onBlurRow: (rowKey: string, attributeId: number, paId: number | null, originalValue: string) => void;

  onDeleteValue: (paId: number) => void;

  onOpenMenu: (
    e: React.MouseEvent<HTMLElement>,
    key: string,
    attr: Attribute,
    paId: number | null,
    currentValue: string,
    canRequestUpdate: boolean,
    canRequestDelete: boolean,
    canRequestCreate?: boolean,
    rowValues?: { id: number; value: string }[]
  ) => void;

  /** Sauvegarde agrégée au niveau ligne (diff added/updated/deleted) */
  onRowSave: (payload: {
    attributeId: number;
    added: { value: string }[];
    updated: { id: number; value: string }[];
    deleted: { id: number }[];
  }) => void;
  onRowCancel?: () => void;

  inlineEditOnChipClickInEditMode?: boolean;
  hasUnsavedChangesByAttrId?: Record<number, boolean>;
};

const AttributesList: React.FC<Props> = ({
  allAttributes,
  profileAttributes,
  editingKey,
  statusByKey,
  attrValue,
  inputRef,
  onChangeAttrValue,
  canEdit,
  canDelete,
  formatDisplayValue,
  pendingByKey,
  onCancelChangeRequest,
  onStartEdit,
  onManualSave, // non utilisé ici (conservé pour compat)
  onCancelEdit,
  onBlurRow,   // non utilisé ici (conservé pour compat)
  onDeleteValue,
  onOpenMenu,
  onRowSave,
  onRowCancel,
  inlineEditOnChipClickInEditMode,
  hasUnsavedChangesByAttrId,
}) => {
  return (
    <Stack spacing={2} divider={<Divider light />}>

      {allAttributes.map((attrDef) => {
        // Toutes les PA (full) pour cet attribut
        const userAttrsFull: PersonAttributeFull[] = profileAttributes.filter(
          (pa) => pa.attribute?.id === attrDef.id
        );

        // Normalisation chips → ce que consomme AttributeRow
        const chips = userAttrsFull.map((pa) => ({
          id: pa.id,
          value: pa.value,
          validFrom: pa.validFrom,
          validTo: pa.validTo,
          pendingDelete: pa.pendingDelete,
        }));

        // Clés d’ajout/édition
        const addKey = `add-${attrDef.id}`;
        const isAdding = editingKey === addKey;
        const addStatus = (statusByKey[addKey] ?? "idle") as RowStatus;

        // Droits
        const count = chips.length;
        const allowAdd = canEdit(attrDef);
        const allowEditRow = canEdit(attrDef);
        const allowDeleteRow = canDelete(attrDef, count);

        // NB: pendingByKey contient possiblement des entrées pour pa-<id> et add-<attrId>
        // AttributeRow se charge d’afficher l’état agrégé via statusSlot

        return (
          <AttributeRow
            key={`attr-${attrDef.id}`}
            attrDef={attrDef}
            chips={chips}
            addKey={addKey}
            isAdding={isAdding}
            addStatus={addStatus}
            editingKey={editingKey}
            statusByKey={statusByKey}
            attrValue={attrValue}
            inputRef={inputRef}
            onChangeAttrValue={onChangeAttrValue}
            allowEdit={allowEditRow}
            allowDelete={allowDeleteRow}
            allowAdd={allowAdd}
            pendingByKey={pendingByKey}
            formatDisplayValue={formatDisplayValue}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onOpenMenu={onOpenMenu}
            onRowSave={onRowSave}
            onRowCancel={onRowCancel}
            inlineEditOnChipClickInEditMode={inlineEditOnChipClickInEditMode}
            hasUnsavedChanges={hasUnsavedChangesByAttrId?.[attrDef.id]}
          />
        );
      })}

    </Stack>
  );
};

export default AttributesList;
