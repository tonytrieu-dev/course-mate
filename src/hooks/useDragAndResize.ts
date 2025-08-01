import { useState, useRef, useEffect, useCallback } from 'react';
import type { Position } from '../types/database';

interface DragRef {
  startX: number;
  startY: number;
  startPosX: number;
  startPosY: number;
}

interface UseDragAndResizeProps {
  position: Position;
  onPositionChange: (position: Position) => void;
  height: number;
  onHeightChange: (height: number) => void;
}

interface UseDragAndResizeReturn {
  isResizing: boolean;
  isDragging: boolean;
  handleDragStart: (e: React.MouseEvent) => void;
  handleResizeStart: (e: React.MouseEvent) => void;
}

export const useDragAndResize = ({
  position,
  onPositionChange,
  height,
  onHeightChange,
}: UseDragAndResizeProps): UseDragAndResizeReturn => {
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const dragRef = useRef<DragRef>({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  }, [position]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY - 20;
        if (newHeight >= 200 && newHeight <= 600) {
          onHeightChange(newHeight);
        }
      } else if (isDragging) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        
        const newX = Math.max(0, Math.min(window.innerWidth - 400, dragRef.current.startPosX + deltaX));
        const newY = Math.max(0, Math.min(window.innerHeight - height, dragRef.current.startPosY - deltaY));
        
        onPositionChange({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsDragging(false);
    };

    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      if (isResizing) {
        document.body.style.cursor = 'ns-resize';
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
  }, [isResizing, isDragging, height, onHeightChange, onPositionChange]);

  return {
    isResizing,
    isDragging,
    handleDragStart,
    handleResizeStart,
  };
};