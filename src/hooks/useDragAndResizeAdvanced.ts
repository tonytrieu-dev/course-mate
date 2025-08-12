import { useState, useRef, useEffect, useCallback } from 'react';
import type { Position } from '../types/database';

interface DragRef {
  startX: number;
  startY: number;
  startPosX: number;
  startPosY: number;
}

interface ResizeRef {
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startPosY: number;
}

interface UseDragAndResizeAdvancedProps {
  position: Position;
  onPositionChange: (position: Position) => void;
  height: number;
  onHeightChange: (height: number) => void;
  width: number;
  onWidthChange: (width: number) => void;
}

interface UseDragAndResizeAdvancedReturn {
  isResizing: boolean;
  isResizingWidth: boolean;
  isResizingHeight: boolean;
  isDragging: boolean;
  handleDragStart: (e: React.MouseEvent) => void;
  handleHeightResizeStart: (e: React.MouseEvent) => void;
  handleWidthResizeStart: (e: React.MouseEvent) => void;
  handleCornerResizeStart: (e: React.MouseEvent) => void;
}

export const useDragAndResizeAdvanced = ({
  position,
  onPositionChange,
  height,
  onHeightChange,
  width,
  onWidthChange,
}: UseDragAndResizeAdvancedProps): UseDragAndResizeAdvancedReturn => {
  const [isResizingHeight, setIsResizingHeight] = useState<boolean>(false);
  const [isResizingWidth, setIsResizingWidth] = useState<boolean>(false);
  const [isResizingCorner, setIsResizingCorner] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const dragRef = useRef<DragRef>({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const resizeRef = useRef<ResizeRef>({ startX: 0, startY: 0, startWidth: 0, startHeight: 0, startPosY: 0 });

  // Computed state for any resize operation
  const isResizing = isResizingHeight || isResizingWidth || isResizingCorner;

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  }, [position]);

  const handleHeightResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingHeight(true);
    resizeRef.current.startY = e.clientY;
    resizeRef.current.startHeight = height;
  }, [height]);

  const handleWidthResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingWidth(true);
    resizeRef.current.startX = e.clientX;
    resizeRef.current.startWidth = width;
  }, [width]);

  const handleCornerResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingCorner(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: width,
      startHeight: height,
      startPosY: position.y
    };
  }, [width, height, position.y]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingHeight) {
        // Height resize (fixed to use delta-based calculation)
        const deltaY = e.clientY - resizeRef.current.startY;
        const newHeight = Math.max(200, Math.min(600, resizeRef.current.startHeight - deltaY));
        onHeightChange(newHeight);
      } else if (isResizingWidth) {
        // Width resize (adapted from useResizable)
        const deltaX = e.clientX - resizeRef.current.startX;
        const newWidth = Math.max(300, Math.min(800, resizeRef.current.startWidth + deltaX));
        onWidthChange(newWidth);
      } else if (isResizingCorner) {
        // Corner resize (both width and height) - natural bottom-right expansion
        const deltaX = e.clientX - resizeRef.current.startX;
        const deltaY = e.clientY - resizeRef.current.startY;
        
        const newWidth = Math.max(300, Math.min(800, resizeRef.current.startWidth + deltaX));
        const newHeight = Math.max(200, Math.min(600, resizeRef.current.startHeight + deltaY));
        
        // Adjust position so bottom edge follows mouse (for bottom-positioned element)
        const heightDelta = newHeight - resizeRef.current.startHeight;
        const newPosY = Math.max(0, resizeRef.current.startPosY - heightDelta);
        
        onWidthChange(newWidth);
        onHeightChange(newHeight);
        onPositionChange({ x: position.x, y: newPosY });
      } else if (isDragging) {
        // Drag logic (existing from useDragAndResize, updated to use current width)
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        
        const newX = Math.max(0, Math.min(window.innerWidth - width, dragRef.current.startPosX + deltaX));
        const newY = Math.max(0, Math.min(window.innerHeight - height, dragRef.current.startPosY - deltaY));
        
        onPositionChange({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsResizingHeight(false);
      setIsResizingWidth(false);
      setIsResizingCorner(false);
      setIsDragging(false);
    };

    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      
      // Set appropriate cursor based on resize type
      if (isResizingHeight) {
        document.body.style.cursor = 'ns-resize';
      } else if (isResizingWidth) {
        document.body.style.cursor = 'ew-resize';
      } else if (isResizingCorner) {
        document.body.style.cursor = 'nw-resize';
      } else if (isDragging) {
        document.body.style.cursor = 'move';
      }
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizingHeight, isResizingWidth, isResizingCorner, isDragging, height, width, onHeightChange, onWidthChange, onPositionChange]);

  return {
    isResizing,
    isResizingWidth,
    isResizingHeight,
    isDragging,
    handleDragStart,
    handleHeightResizeStart,
    handleWidthResizeStart,
    handleCornerResizeStart,
  };
};