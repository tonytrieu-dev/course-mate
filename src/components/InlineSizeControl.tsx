import React, { useCallback } from 'react';

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
  const handleDecrease = useCallback(() => {
    setSize(Math.max(minSize, size - 2));
  }, [setSize, minSize, size]);

  const handleIncrease = useCallback(() => {
    setSize(Math.min(maxSize, size + 2));
  }, [setSize, maxSize, size]);

  const handleClose = useCallback(() => {
    setShow(false);
  }, [setShow]);

  if (!show) return null;

  return (
    <div className="inline-flex items-center ml-2 bg-white border border-gray-300 rounded-md shadow-sm px-2 py-1 space-x-1">
      <button
        onClick={handleDecrease}
        className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-xs flex items-center justify-center"
        type="button"
        aria-label="Decrease font size"
      >
        −
      </button>
      <span className="text-xs text-gray-600 w-8 text-center">{size}</span>
      <button
        onClick={handleIncrease}
        className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-xs flex items-center justify-center"
        type="button"
        aria-label="Increase font size"
      >
        +
      </button>
      <button
        onClick={handleClose}
        className="w-6 h-6 text-gray-400 hover:text-gray-600 text-xs flex items-center justify-center"
        type="button"
        aria-label="Close size control"
      >
        ✕
      </button>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(InlineSizeControl);