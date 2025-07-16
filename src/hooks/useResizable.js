import { useState, useEffect, useRef } from 'react';

export const useResizable = (initialWidth, minWidth, maxWidth, storageKey) => {
  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      return saved ? parseInt(saved, 10) : initialWidth;
    }
    return initialWidth;
  });
  const [isResizing, setIsResizing] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
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

  const startResize = (e) => {
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