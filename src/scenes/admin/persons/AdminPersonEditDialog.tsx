import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormHelperText,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Attribute } from "../../../models/commons/Attribute/Attribute";
import { AttributeChanges } from "../../../models/commons/Profile/AttributesChanges";
import { PersonAttributeExtraDto, PersonCardDto } from "../../../services/dto/person/search/PersonCardDtos";
import { buildAttributeChanges } from "./utils/buildAttributeChanges";
import EmailsPanel from "./components/EmailsPanel";
import InvitationsPanel from "./components/InvitationsPanel";

type Props = {
  open: boolean;
  person: PersonCardDto | null | undefined;
  attributes: Attribute[];
  currentExtras: PersonAttributeExtraDto[];
  onClose: () => void;
  onSubmitMany: (changesByAttr: Record<number, AttributeChanges>) => Promise<void> | void;
  loading?: boolean;
  filterAttribute?: (a: Attribute) => boolean;
  defaultTab?: "profil" | "contacts";
};

type ExistingValue = { id: number; value: string };

function toExistingMap(extras: PersonAttributeExtraDto[]): Record<number, ExistingValue[]> {
  const map: Record<number, ExistingValue[]> = {};
  (extras || []).forEach((e) => {
    const attrId = e?.attributeId;
    if (attrId == null) return;
    if (!map[attrId]) map[attrId] = [];
    map[attrId].push({ id: e?.attributeId ?? 0, value: e?.value ?? "" });
  });
  return map;
}

function splitToTokens(input: string): string[] {
  return input
    .split(/[\n,;]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeValues(next: string[], max?: number | null): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of next) {
    const v = raw.trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (max && max > 0 && out.length >= max) break;
  }
  return out;
}

const isMultiple = (a: Attribute) => (a.maxValues === 1 ? false : true);
const isEnum = (a: Attribute) => Array.isArray(a.options) && a.options.length > 0;

const AdminPersonEditDialog: React.FC<Props> = ({
  open,
  person,
  attributes,
  currentExtras,
  onClose,
  onSubmitMany,
  loading,
  filterAttribute,
  defaultTab = "profil",
}) => {
  const [tab, setTab] = useState<0 | 1>(defaultTab === "contacts" ? 1 : 0);
  useEffect(() => {
    if (!open) return;
    setTab(defaultTab === "contacts" ? 1 : 0);
  }, [open, defaultTab]);

  const existingMap = useMemo(() => toExistingMap(currentExtras || []), [currentExtras]);

  const [draft, setDraft] = useState<Record<number, string[]>>({});
  const [errors, setErrors] = useState<Record<number, string | undefined>>({});
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!open || !person) return;
    const init: Record<number, string[]> = {};
    const initErr: Record<number, string | undefined> = {};
    attributes.forEach((a) => {
      if (filterAttribute && !filterAttribute(a)) return;
      init[a.id] = (existingMap[a.id] ?? []).map((v) => v.value);
      initErr[a.id] = undefined;
    });
    setDraft(init);
    setErrors(initErr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, person?.idPerson, attributes, existingMap]);

  const setOne = (attributeId: number, values: string[], max?: number | null, required?: boolean | null) => {
    const normalized = normalizeValues(values, max);
    let err: string | undefined;
    if (required && normalized.length === 0) err = "Ce champ est requis.";
    setDraft((prev) => ({ ...prev, [attributeId]: normalized }));
    setErrors((prev) => ({ ...prev, [attributeId]: err }));
  };

  const visibleAttributes = useMemo(
    () =>
      attributes
        .filter((a) => (filterAttribute ? filterAttribute(a) : true))
        .sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999)),
    [attributes, filterAttribute]
  );

  const changesByAttr = useMemo(() => {
    const out: Record<number, AttributeChanges> = {};
    visibleAttributes.forEach((a) => {
      const existing = existingMap[a.id] ?? [];
      const next = draft[a.id] ?? [];
      out[a.id] = buildAttributeChanges(existing, next, a.maxValues ?? null);
    });
    return out;
  }, [visibleAttributes, existingMap, draft]);

  const hasAnyChange = useMemo(
    () => Object.values(changesByAttr).some((c) => c.create.length + c.update.length + c.delete.length > 0),
    [changesByAttr]
  );
  const hasAnyError = useMemo(() => Object.values(errors).some(Boolean), [errors]);

  const onSave = async () => {
    await onSubmitMany(changesByAttr);
  };

  const pid = person?.idPerson ?? null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Éditer • {person?.idPerson ?? "—"} {person?.displayName ? `• ${person.displayName}` : ""}
      </DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" aria-label="Onglets d'édition">
        <Tab label="Profil" id="tab-0" aria-controls="tabpanel-0" />
        <Tab label="Contacts & Invitations" id="tab-1" aria-controls="tabpanel-1" />
      </Tabs>

      {tab === 0 && (
        <DialogContent dividers id="tabpanel-0" role="tabpanel" aria-labelledby="tab-0">
          <Stack spacing={2}>
            {visibleAttributes.map((attr) => {
              const values = draft[attr.id] ?? [];
              const multiple = isMultiple(attr);
              const enumish = isEnum(attr);
              const max = attr.maxValues ?? null;
              const required = !!attr.required;
              const helper = errors[attr.id];
              const maxInfo = multiple && max && max > 0 ? `${values.length}/${max}` : undefined;

              if (enumish && multiple) {
                const options = (attr.options ?? []).map(
                  (o: any) => o?.value ?? o?.code ?? (o?.id != null ? String(o.id) : "")
                );
                const limitReached = !!(max && max > 0 && values.length >= max);
                const getDisabled = (opt: string) => limitReached && !values.includes(opt);

                return (
                  <Box key={attr.id}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {attr.name}
                      {required ? " *" : ""}{" "}
                      {maxInfo && (
                        <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                          {maxInfo}
                        </Typography>
                      )}
                    </Typography>
                    <Autocomplete
                      multiple
                      options={options}
                      filterSelectedOptions
                      value={values}
                      getOptionDisabled={getDisabled}
                      onChange={(_, v) => setOne(attr.id, v as string[], max, required)}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => (
                          <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Sélectionner…" error={!!helper} helperText={helper} />
                      )}
                    />
                  </Box>
                );
              }

              if (enumish && !multiple) {
                const options = (attr.options ?? []).map(
                  (o: any) => o?.value ?? o?.code ?? (o?.id != null ? String(o.id) : "")
                );
                return (
                  <Box key={attr.id}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {attr.name}
                      {required ? " *" : ""}
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      value={values[0] ?? ""}
                      onChange={(e) => setOne(attr.id, [e.target.value], 1, required)}
                      error={!!helper}
                      helperText={helper}
                    >
                      <MenuItem value="">
                        <em>(vide)</em>
                      </MenuItem>
                      {options.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                );
              }

              if (!enumish && multiple) {
                const limit = max && max > 0 ? max : undefined;

                return (
                  <Box key={attr.id}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {attr.name}
                      {required ? " *" : ""}{" "}
                      {limit && (
                        <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                          {values.length}/{limit}
                        </Typography>
                      )}
                    </Typography>

                    <Autocomplete
                      multiple
                      freeSolo
                      value={values}
                      options={[]}
                      filterSelectedOptions
                      onChange={(_, v) => setOne(attr.id, v as string[], max, required)}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => (
                          <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Saisir une valeur puis Entrée"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const raw = (e.currentTarget as HTMLInputElement)?.value?.trim();
                              if (raw) {
                                const newTokens = splitToTokens(raw);
                                const next = normalizeValues([...values, ...newTokens], max);
                                setOne(attr.id, next, max, required);
                                (e.currentTarget as HTMLInputElement).value = "";
                              }
                              e.preventDefault();
                            }
                          }}
                          onBlur={(e) => {
                            const raw = (e.currentTarget as HTMLInputElement)?.value?.trim();
                            if (raw) {
                              const newTokens = splitToTokens(raw);
                              const next = normalizeValues([...values, ...newTokens], max);
                              setOne(attr.id, next, max, required);
                              (e.currentTarget as HTMLInputElement).value = "";
                            }
                          }}
                          onPaste={(e) => {
                            const text = e.clipboardData.getData("text");
                            if (text) {
                              e.preventDefault();
                              const tokens = splitToTokens(text);
                              const next = normalizeValues([...values, ...tokens], max);
                              setOne(attr.id, next, max, required);
                            }
                          }}
                          error={!!helper}
                          helperText={
                            helper ??
                            "Astuce : Entrée pour valider. Vous pouvez aussi coller plusieurs valeurs (séparées par virgules, point-virgules ou retours à la ligne)."
                          }
                        />
                      )}
                    />
                    {limit && values.length >= limit && (
                      <FormHelperText sx={{ mt: 0.5 }}>
                        Limite atteinte : {limit} valeur{limit > 1 ? "s" : ""}.
                      </FormHelperText>
                    )}
                  </Box>
                );
              }

              return (
                <Box key={attr.id}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {attr.name}
                    {required ? " *" : ""}
                  </Typography>
                  <TextField
                    fullWidth
                    value={values[0] ?? ""}
                    onChange={(e) => setOne(attr.id, [e.target.value], 1, required)}
                    error={!!helper}
                    helperText={helper}
                  />
                </Box>
              );
            })}
          </Stack>
        </DialogContent>
      )}

      {tab === 1 && (
        <DialogContent dividers id="tabpanel-1" role="tabpanel" aria-labelledby="tab-1">
          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
              Contacts & Invitations pour <strong>{person?.displayName || (pid ? `#${pid}` : "—")}</strong>
            </Typography>

            {pid !== null && <EmailsPanel personId={pid} />}

            <Divider />

            {pid !== null && <InvitationsPanel personId={pid} />}
          </Stack>
        </DialogContent>
      )}

      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
        {tab === 0 && (
          <Button variant="contained" onClick={onSave} disabled={loading || !hasAnyChange || hasAnyError}>
            Enregistrer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AdminPersonEditDialog;
