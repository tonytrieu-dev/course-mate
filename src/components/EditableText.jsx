import React, { useRef, useEffect, useCallback } from 'react';
import { useTextFormatting } from '../contexts/TextFormattingContext';

const EditableText = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  isEditing,
  onClick,
  onDoubleClick,
  className = "",
  style = {},
  elementType,
  placeholder,
  title,
  children,
  ...props
}) => {
  const { restoreElementFormatting } = useTextFormatting();
  const elementRef = useRef(null);

  useEffect(() => {
    if (elementRef.current && isEditing) {
      const element = elementRef.current;
      
      // Restore saved formatting
      if (elementType) {
        restoreElementFormatting(element, elementType);
      }
      
      // Focus and set cursor at end
      element.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(element);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [isEditing, elementType, restoreElementFormatting]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onBlur && onBlur();
    }
    onKeyDown && onKeyDown(e);
  }, [onBlur, onKeyDown]);

  if (isEditing) {
    return (
      <div
        ref={elementRef}
        contentEditable
        suppressContentEditableWarning={true}
        data-element-type={elementType}
        onInput={(e) => onChange && onChange(e.target.textContent)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        className={className}
        style={style}
        data-placeholder={placeholder}
        {...props}
      >
        {value}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={title}
      {...props}
    >
      {children || value}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(EditableText);