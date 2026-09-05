import type { ValueType } from "../../../../../models/commons/Attribute/Attribute";

// Kept as a private literal (rather than importing attributeForm.semantic's
// DEFAULT_CUSTOM_VALUE_TYPE) so this module stays a dependency-free leaf that
// can be imported directly by the node:test runner.
const DEFAULT_CUSTOM_VALUE_TYPE: ValueType = "TEXT";

export type CustomTypeSelectionState = {
  type: ValueType;
  confirmed: boolean;
};

/**
 * Called when leaving a concept-driven branch (e.g. Genre) for the custom
 * type branch. The concept's value type (e.g. ENUM) must not survive into
 * the custom flow, and no card should read as selected until the user
 * actually picks one.
 */
export function resetCustomTypeSelection(): CustomTypeSelectionState {
  return { type: DEFAULT_CUSTOM_VALUE_TYPE, confirmed: false };
}

export function confirmCustomTypeSelection(type: ValueType): CustomTypeSelectionState {
  return { type, confirmed: true };
}

export function resolvePickerValue(state: CustomTypeSelectionState): ValueType | null {
  return state.confirmed ? state.type : null;
}
