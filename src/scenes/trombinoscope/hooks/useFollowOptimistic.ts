import { useCallback, useState } from "react";
import { subscribeOne, unsubscribeOne } from "../../../services/business/subscriptions/subscriptions.service";

export default function useFollowOptimistic(onSynced?: () => Promise<void> | void) {
  const [overrides, setOverrides] = useState<Record<number, boolean | undefined>>({});
  const [pending, setPending] = useState<Set<number>>(new Set());

  const toggle = useCallback(async (id: number, target: boolean) => {
    setOverrides(prev => ({ ...prev, [id]: target }));
    setPending(prev => { const n = new Set(prev); n.add(id); return n; });
    try {
      if (target) await subscribeOne(id); else await unsubscribeOne(id);
      await onSynced?.();
      setOverrides(prev => { const c = { ...prev }; delete c[id]; return c; });
    } catch {
      setOverrides(prev => ({ ...prev, [id]: !target }));
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, [onSynced]);

  return { overrides, pending, toggle };
}
