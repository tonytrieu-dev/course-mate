import React, { useRef, useEffect, useCallback, CSSProperties, ReactNode, HTMLAttributes } from 'react';
import { useTextFormatting } from '../contexts/TextFormattingContext';

interface EditableTextProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'onBlur' | 'onKeyDown'> {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  isEditing: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  style?: CSSProperties;
  elementType?: string;
  placeholder?: string;
  title?: string;
  children?: ReactNode;
}

const EditableText: React.FC<EditableTextProps> = ({
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
  const elementRef = useRef<HTMLDivElement>(null);
  const isInitialEditRef = useRef<boolean>(true);
  const lastValueRef = useRef<string>(value);

  // Store and restore cursor position to prevent jumping
  const getCursorPosition = useCallback(() => {
    const element = elementRef.current;
    if (!element) return 0;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }, []);

  const setCursorPosition = useCallback((position: number) => {
    const element = elementRef.current;
    if (!element) return;
    
    const textNode = element.childNodes[0] || element;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      const range = document.createRange();
      const selection = window.getSelection();
      
      if (selection) {
        const safePosition = Math.min(position, textNode.textContent?.length || 0);
        range.setStart(textNode, safePosition);
        range.setEnd(textNode, safePosition);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, []);

  useEffect(() => {
    if (elementRef.current && isEditing) {
      const element = elementRef.current;
      
      // Only set up cursor position on initial edit, not on every re-render
      if (isInitialEditRef.current) {
        // Restore saved formatting
        if (elementType) {
          restoreElementFormatting(element, elementType);
        }
        
        // Focus and set cursor at end - only when first entering edit mode
        element.focus();
        
        // Set initial content and cursor position
        element.textContent = value;
        
        // Use setTimeout to ensure this runs after DOM updates
        setTimeout(() => {
          setCursorPosition(value.length);
        }, 0);
        
        isInitialEditRef.current = false;
      } else if (value !== lastValueRef.current) {
        // Value changed externally, preserve cursor position
        const cursorPosition = getCursorPosition();
        element.textContent = value;
        setTimeout(() => {
          setCursorPosition(cursorPosition);
        }, 0);
      }
      
      lastValueRef.current = value;
    } else {
      // Reset for next edit session
      isInitialEditRef.current = true;
      lastValueRef.current = value;
    }
  }, [isEditing, value, getCursorPosition, setCursorPosition, elementType, restoreElementFormatting]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onBlur && onBlur();
    }
    onKeyDown && onKeyDown(e);
  }, [onBlur, onKeyDown]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const newValue = target.textContent || '';
    lastValueRef.current = newValue;
    onChange && onChange(newValue);
  }, [onChange]);

  if (isEditing) {
    return (
      <div
        ref={elementRef}
        contentEditable
        suppressContentEditableWarning={true}
        data-element-type={elementType}
        onInput={handleInput}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        className={className}
        style={style}
        data-placeholder={placeholder}
        {...props}
      />
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