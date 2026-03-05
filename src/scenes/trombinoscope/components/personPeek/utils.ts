// src/components/trombinoscope/components/personPeek/utils.ts
import { useMemo } from "react";
import { Attribute } from "../../../../models/commons/Attribute/Attribute";
import { PersonAttributeExtraDto } from "../../../../services/dto/person/search/PersonCardDtos";

/**
 * Affiche un nom robuste :
 * 1) p.displayName s’il existe (quel que soit son type → cast string)
 * 2) sinon à partir de primaryAttributes (valeurs concaténées)
 * 3) sinon "—" (et log console en dev pour debug)
 */
export const displayName = (p: any | null | undefined) => {
  if (!p) return "—";

  const raw = (p as any).displayName;
  const fromProp = raw == null ? "" : String(raw).trim();
  if (fromProp) return fromProp;

  const primaryAttributes = (p as any).primaryAttributes as any[] | undefined;

  const prim =
    primaryAttributes && Array.isArray(primaryAttributes)
      ? primaryAttributes
          .filter((x: any) => !!x?.value)
          .map((x: any) => String(x.value).trim())
          .filter(Boolean)
          .join(" ")
          .trim()
      : "";

  if (prim) return prim;

  // Cas anormal : aucune info exploitable → on log pour pouvoir corriger côté données
  // eslint-disable-next-line no-console
  console.warn("[displayName] Impossible de déterminer un nom pour la personne :", {
    idPerson: (p as any)?.idPerson,
    rawDisplayName: raw,
    primaryAttributes,
  });

  return "—";
};

function isIsoDateLike(s: string) {
  return /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$/.test(s);
}

export function useAttributeMeta(source: Attribute[] | undefined) {
  return useMemo(() => {
    const map = new Map<number, Attribute>();
    (source || []).forEach((a) => {
      if (a?.id != null) map.set(a.id, a);
    });

    const getAttrMeta = (id: number) => map.get(id);
    const getAttrLabel = (id: number) => map.get(id)?.name ?? `Attribut #${id}`;
    const getAttrMaxValues = (id: number) => map.get(id)?.maxValues ?? 1;
    const getAttrOrder =
      (id: number) => map.get(id)?.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const isCategoryAttr = (id: number) => !!map.get(id)?.category;
    const isPrimaryAttr = (id: number) => !!map.get(id)?.identitySource;

    const isDateAttr = (id: number) => {
      const a = map.get(id);
      const type = (a?.type ?? "").toString().toUpperCase();
      const kind = (a?.constraintKind ?? "").toString().toUpperCase();
      return type.includes("DATE") || kind.includes("DATE");
    };

    const formatDateLocal = (raw: string) => {
      if (!raw) return raw;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(d);
    };

    const prettyValue = (id: number, raw: string) => {
      const attr = map.get(id);
      const opt = attr?.options?.find((o) => o.code === raw);
      if (opt?.label) return opt.label;
      if (isDateAttr(id) || isIsoDateLike(raw)) return formatDateLocal(raw);
      return raw;
    };

    const isLongTextAttr = (id: number, value: string) => {
      const a = map.get(id);
      const type = (a?.type ?? "").toString().toUpperCase();
      const kind = (a?.constraintKind ?? "").toString().toUpperCase();
      const payload: any = a?.constraintPayload ?? {};
      const multiline =
        payload?.multiline === true ||
        payload?.multiLine === true ||
        payload?.richText === true;

      const longByType = ["TEXTAREA", "LONG_TEXT", "RICH_TEXT"].includes(type);
      const longByKind = ["LONG_TEXT", "RICH_TEXT"].includes(kind);
      const longByValue =
        (value?.length ?? 0) > 80 || /\n/.test(value ?? "");

      return Boolean(longByType || longByKind || multiline || longByValue);
    };

    return {
      getAttrMeta,
      getAttrLabel,
      getAttrMaxValues,
      getAttrOrder,
      prettyValue,
      isCategoryAttr,
      isPrimaryAttr,
      isLongTextAttr,
    };
  }, [source]);
}

/** PersonAttributeLite[] -> PersonAttributeExtraDto[] */
export function mapLiteToExtra(
  list: any[] | undefined | null
): PersonAttributeExtraDto[] {
  if (!list) return [];
  const out: PersonAttributeExtraDto[] = [];

  for (const it of list as any[]) {
    const idRaw =
      it?.attributeId ??
      it?.idAttribute ??
      it?.attribute?.id ??
      it?.id;
    const valueRaw =
      it?.value ??
      it?.rawValue ??
      it?.text ??
      it?.code ??
      it?.label;
    const orderRaw =
      it?.displayOrder ?? it?.attribute?.displayOrder;

    const attributeId = idRaw != null ? Number(idRaw) : undefined;
    const value =
      valueRaw != null ? String(valueRaw) : undefined;
    const displayOrder: number | null =
      orderRaw == null ? null : Number(orderRaw);

    if (attributeId != null && value != null) {
      out.push({ attributeId, value, displayOrder });
    }
  }
  return out;
}
