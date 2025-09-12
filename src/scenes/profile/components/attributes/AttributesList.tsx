import React from "react";
import { Stack, Divider } from "@mui/material";
import AttributeRow, { RowStatus } from "./rows/AttributeRow";
import { Attribute } from "../../../../models/commons/Attribute";
import { PersonAttributeFull } from "../../../../models/commons/PersonAttribute";
import { ChangeRequestSummary } from "../../../../models/commons/Profile/ChangeRequest";

type Props = {
  allAttributes: Attribute[];
  profileAttributes: PersonAttributeFull[];

  editingKey: string | null;
  statusByKey: Record<string, RowStatus>;
  attrValue: string;
  inputRef: React.Ref<any>;
  onChangeAttrValue: (v: string) => void;

  canEdit: (attrDef: Attribute) => boolean;
  canDelete: (attrDef: Attribute, currentCount: number) => boolean;
  formatDisplayValue: (type: string | null | undefined, value: string) => string;

  onStartEdit: (rowKey: string, attributeId: number, paId: number | null, currentValue: string) => void;
  onCancelEdit: () => void;

  onOpenChangeRequest: (attr: Attribute, rowValues: { id: number; value: string }[]) => void;

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

  // NEW: enveloppes CR complètes + callback pour ouvrir une CR existante
  changeRequests: ChangeRequestSummary[];
  onOpenExistingChangeRequest: (crId: number) => void;
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
  onStartEdit,
  onCancelEdit,
  onOpenChangeRequest,
  onRowSave,
  onRowCancel,
  inlineEditOnChipClickInEditMode,
  hasUnsavedChangesByAttrId,
  // NEW
  changeRequests,
  onOpenExistingChangeRequest,
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
            formatDisplayValue={formatDisplayValue}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onOpenChangeRequest={onOpenChangeRequest}
            onRowSave={onRowSave}
            onRowCancel={onRowCancel}
            inlineEditOnChipClickInEditMode={inlineEditOnChipClickInEditMode}
            hasUnsavedChanges={hasUnsavedChangesByAttrId?.[attrDef.id]}
            // NEW
            changeRequests={changeRequests}
            onOpenExistingChangeRequest={onOpenExistingChangeRequest}
          />
        );
      })}
    </Stack>
  );
};

export default AttributesList;
