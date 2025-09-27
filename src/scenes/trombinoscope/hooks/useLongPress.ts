import { useRef } from "react";

type Opts = { delay?: number };

/** Long press hook: fournit { bind, suppressClickRef }  */
export default function useLongPress<T extends Element>(
  onLongPress: (ev: React.MouseEvent<T> | React.TouchEvent<T>) => void,
  opts: Opts = {}
) {
  const delay = opts.delay ?? 500;
  const timer = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const start = (e: any) => {
    clear();
    suppressClickRef.current = false;
    timer.current = window.setTimeout(() => {
      onLongPress(e);
      suppressClickRef.current = true; // évite le onClick derrière
    }, delay) as unknown as number;
  };

  const clear = () => {
    if (timer.current != null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const bind = {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchCancel: clear,
    onContextMenu: (e: any) => e.preventDefault(), // évite menu contextuel mobile
  };

  return { bind, suppressClickRef };
}
