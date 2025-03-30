// useOverflow.tsx
import { useEffect, useRef, useState } from 'react';

function useOverflow(ref: React.RefObject<HTMLElement>, threshold: number = 2): boolean {
  const [isOverflow, setIsOverflow] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const checkOverflow = () => {
      // On considère qu'il y a débordement si scrollWidth dépasse clientWidth d'au moins "threshold" pixels
      setIsOverflow(element.scrollWidth > element.clientWidth + threshold);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });
    resizeObserver.observe(element);

    window.addEventListener('resize', checkOverflow);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [ref, threshold]);

  return isOverflow;
}

export default useOverflow;
