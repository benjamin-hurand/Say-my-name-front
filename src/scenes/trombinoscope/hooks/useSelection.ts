import { useMemo, useState } from "react";

export type Id = number;

export default function useSelection(totalElements?: number) {
  const [selectedIds, setSelectedIds] = useState<Set<Id>>(new Set());
  const [selectAllResults, setSelectAllResults] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<Id>>(new Set());

  const clearSelection = () => { setSelectedIds(new Set()); setSelectAllResults(false); setExcludedIds(new Set()); };

  const toggleSelect = (id: Id) => {
    if (selectAllResults) {
      setExcludedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
  };

  const selectAllVisible = (visibleIds: Id[]) => {
    if (selectAllResults) setExcludedIds(prev => { const n = new Set(prev); visibleIds.forEach(id => n.delete(id)); return n; });
    else setSelectedIds(prev => { const n = new Set(prev); visibleIds.forEach(id => n.add(id)); return n; });
  };

  const deselectAllVisible = (visibleIds: Id[]) => {
    if (selectAllResults) setExcludedIds(prev => { const n = new Set(prev); visibleIds.forEach(id => n.add(id)); return n; });
    else setSelectedIds(prev => { const n = new Set(prev); visibleIds.forEach(id => n.delete(id)); return n; });
  };

  const selectionCount = useMemo(() => {
    if (selectAllResults) return Math.max(0, (totalElements ?? 0) - excludedIds.size);
    return selectedIds.size;
  }, [selectAllResults, excludedIds, selectedIds, totalElements]);

  return {
    // state
    selectedIds, selectAllResults, excludedIds, selectionCount,
    // actions
    setSelectedIds, setSelectAllResults, setExcludedIds,
    clearSelection, toggleSelect, selectAllVisible, deselectAllVisible,
  };
}
