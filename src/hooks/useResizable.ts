import { useState, useEffect, useRef } from 'react';

/**
 * Return type for useResizable hook
 */
interface UseResizableReturn {
  width: number;
  setWidth: (width: number) => void;
  isResizing: boolean;
  startResize: (e: React.MouseEvent) => void;
  elementRef: React.RefObject<HTMLElement | null>;
}

/**
 * Hook for making elements resizable with mouse drag
 * @param initialWidth - Initial width of the element
 * @param minWidth - Minimum allowed width
 * @param maxWidth - Maximum allowed width
 * @param storageKey - Optional localStorage key to persist width
 * @returns Object with width state and resize handlers
 */
export const useResizable = (
  initialWidth: number,
  minWidth: number,
  maxWidth: number,
  storageKey?: string
): UseResizableReturn => {
  const [width, setWidth] = useState<number>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      return saved ? parseInt(saved, 10) : initialWidth;
    }
    return initialWidth;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        if (storageKey) {
          localStorage.setItem(storageKey, width.toString());
        }
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      document.body.classList.add('sidebar-resizing');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.classList.remove('sidebar-resizing');
    };
  }, [isResizing, width, minWidth, maxWidth, storageKey]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return {
    width,
    setWidth,
    isResizing,
    startResize,
    elementRef
  };
};