import { useState, useEffect, useRef, useCallback } from 'react';

// Throttle utility for smooth performance
const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: unknown[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

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
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Cancel previous animation frame if it hasn't executed yet
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Use requestAnimationFrame for smooth updates
      rafRef.current = requestAnimationFrame(() => {
        const now = Date.now();
        // Throttle updates to 60fps (16ms) for smooth performance
        if (now - lastUpdateRef.current >= 8) { // Reduced throttle for smoother resizing
          // Calculate delta from starting position and apply to starting width
          const deltaX = e.clientX - startXRef.current;
          const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
          setWidth(newWidth);
          lastUpdateRef.current = now;
        }
      });
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        
        // Cancel any pending animation frame
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        
        // Save to localStorage with a slight delay to avoid blocking
        // Safari-compatible requestIdleCallback with fallback
        if (storageKey) {
          const saveToStorage = () => {
            localStorage.setItem(storageKey, width.toString());
          };
          
          if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(saveToStorage, { timeout: 100 });
          } else {
            // Safari fallback: use setTimeout with minimal delay
            setTimeout(saveToStorage, 16); // ~1 frame at 60fps
          }
        }
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize'; // Better cursor for horizontal resize
      document.body.classList.add('sidebar-resizing');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.classList.remove('sidebar-resizing');
      
      // Cleanup animation frame on unmount
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isResizing, width, minWidth, maxWidth, storageKey]);

  const startResize = useCallback((e: React.MouseEvent) => {
    // Complete event isolation
    e.preventDefault();
    e.stopPropagation();
    
    // Additional safety: only proceed if this is a left mouse button click
    if (e.button !== 0) return;
    
    // Capture starting position and width for accurate delta calculation
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    setIsResizing(true);
  }, [width]);

  return {
    width,
    setWidth,
    isResizing,
    startResize,
    elementRef
  };
};