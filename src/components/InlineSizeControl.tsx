import React, { useCallback, useEffect, useRef } from 'react';

interface InlineSizeControlProps {
  size: number;
  setSize: (size: number) => void;
  minSize?: number;
  maxSize?: number;
  show: boolean;
  setShow: (show: boolean) => void;
}

const InlineSizeControl: React.FC<InlineSizeControlProps> = ({ 
  size, 
  setSize, 
  minSize = 12, 
  maxSize = 60, 
  show, 
  setShow 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDecrease = useCallback(() => {
    setSize(Math.max(minSize, size - 2));
  }, [setSize, minSize, size]);

  const handleIncrease = useCallback(() => {
    setSize(Math.min(maxSize, size + 2));
  }, [setSize, maxSize, size]);

  const handleClose = useCallback(() => {
    setShow(false);
  }, [setShow]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'ArrowLeft' || e.key === '-') {
      e.preventDefault();
      handleDecrease();
    } else if (e.key === 'ArrowRight' || e.key === '+' || e.key === '=') {
      e.preventDefault();
      handleIncrease();
    }
  }, [handleClose, handleDecrease, handleIncrease]);

  // Focus management
  useEffect(() => {
    if (show && containerRef.current) {
      containerRef.current.focus();
    }
  }, [show]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined; // Explicit return for all code paths
  }, [show, setShow]);

  if (!show) return null;

  const isAtMin = size <= minSize;
  const isAtMax = size >= maxSize;
  const progress = ((size - minSize) / (maxSize - minSize)) * 100;

  return (
    <div 
      ref={containerRef}
      className="absolute top-1/2 -translate-y-1/2 right-2 z-50 flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-2 py-1.5 space-x-1.5 
                 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 animate-fadeIn"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="toolbar"
      aria-label={`Font size control. Current size: ${size}px. Use arrow keys or +/- to adjust.`}
      style={{
        position: 'absolute',
        top: '50%',
        right: '8px',
        transform: 'translateY(-50%)',
        zIndex: 50
      }}
    >
      {/* Size decrease button */}
      <button
        onClick={handleDecrease}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onFocus={(e) => e.preventDefault()}
        disabled={isAtMin}
        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center
                   transition-all duration-150 shadow-sm focus:outline-none
                   ${isAtMin 
                     ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                     : 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:scale-105 active:scale-95'
                   }`}
        type="button"
        aria-label={`Decrease font size to ${Math.max(minSize, size - 2)}px`}
        title={isAtMin ? `Minimum size (${minSize}px)` : `Decrease to ${Math.max(minSize, size - 2)}px`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
        </svg>
      </button>

      {/* Compact size display */}
      <div className="text-xs font-bold text-gray-800 dark:text-gray-200 tabular-nums px-2 min-w-[32px] text-center">
        {size}px
      </div>

      {/* Size increase button */}
      <button
        onClick={handleIncrease}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onFocus={(e) => e.preventDefault()}
        disabled={isAtMax}
        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center
                   transition-all duration-150 shadow-sm focus:outline-none
                   ${isAtMax 
                     ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                     : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40 text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:scale-105 active:scale-95'
                   }`}
        type="button"
        aria-label={`Increase font size to ${Math.min(maxSize, size + 2)}px`}
        title={isAtMax ? `Maximum size (${maxSize}px)` : `Increase to ${Math.min(maxSize, size + 2)}px`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(InlineSizeControl);