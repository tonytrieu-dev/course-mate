import React from 'react';

const InlineSizeControl = ({ 
  size, 
  setSize, 
  minSize = 12, 
  maxSize = 60, 
  show, 
  setShow 
}) => {
  if (!show) return null;

  return (
    <div className="inline-flex items-center ml-2 bg-white border border-gray-300 rounded-md shadow-sm px-2 py-1 space-x-1">
      <button
        onClick={() => setSize(Math.max(minSize, size - 2))}
        className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-xs flex items-center justify-center"
      >
        −
      </button>
      <span className="text-xs text-gray-600 w-8 text-center">{size}</span>
      <button
        onClick={() => setSize(Math.min(maxSize, size + 2))}
        className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-xs flex items-center justify-center"
      >
        +
      </button>
      <button
        onClick={() => setShow(false)}
        className="w-6 h-6 text-gray-400 hover:text-gray-600 text-xs flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  );
};

export default InlineSizeControl;