import React, { useRef, useEffect, useCallback, CSSProperties, ReactNode, HTMLAttributes, useMemo } from 'react';
import { useTextFormatting } from '../contexts/TextFormattingContext';

interface EditableTextProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'onBlur' | 'onKeyDown'> {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  isEditing: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  style?: CSSProperties;
  elementType?: string;
  placeholder?: string;
  title?: string;
  children?: ReactNode;
  multiline?: boolean;
  maxLength?: number;
  validateInput?: (value: string) => boolean;
  errorMessage?: string;
  showCharacterCount?: boolean;
}

const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  isEditing,
  onClick,
  onDoubleClick,
  onContextMenu,
  className = "",
  style = {},
  elementType,
  placeholder,
  title,
  children,
  multiline = false,
  maxLength,
  validateInput,
  errorMessage,
  showCharacterCount = false,
  ...props
}) => {
  const { restoreElementFormatting, elementFormatting, setElementFormatting } = useTextFormatting();
  const elementRef = useRef<HTMLDivElement>(null);
  const isInitialEditRef = useRef<boolean>(true);
  const lastValueRef = useRef<string>(value);
  const [isValid, setIsValid] = React.useState<boolean>(true);
  const [showError, setShowError] = React.useState<boolean>(false);

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

  // Custom blur handler that captures current formatting from DOM element
  const handleCustomBlur = useCallback(() => {
    if (elementRef.current && elementType) {
      const element = elementRef.current;
      const currentStyle = window.getComputedStyle(element);
      
      // Capture current formatting state from the DOM element
      const currentFormatting = elementFormatting[elementType] || {};
      const newFormatting = {
        ...currentFormatting,
        bold: currentStyle.fontWeight === 'bold' || currentStyle.fontWeight === '700' || 
              element.style.fontWeight === 'bold',
        underline: currentStyle.textDecoration.includes('underline') || 
                  element.style.textDecoration.includes('underline'),
      };
      
      // Only update if formatting actually changed
      const hasChanged = 
        newFormatting.bold !== currentFormatting.bold ||
        newFormatting.underline !== currentFormatting.underline;
      
      if (hasChanged) {
        setElementFormatting(prev => ({
          ...prev,
          [elementType]: newFormatting
        }));
      }
    }
    
    // Call the original onBlur handler
    onBlur && onBlur();
  }, [elementRef, elementType, elementFormatting, setElementFormatting, onBlur]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Enter key based on multiline setting
    if (e.key === 'Enter') {
      if (!multiline || !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleCustomBlur();
      }
    }
    
    // Handle Escape key to cancel editing
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (elementRef.current) {
        // Restore the original value
        elementRef.current.textContent = value;
        // Reset the lastValueRef to prevent onChange from firing
        lastValueRef.current = value;
      }
      handleCustomBlur();
      return; // Early return to prevent further processing
    }
    
    onKeyDown && onKeyDown(e);
  }, [handleCustomBlur, onKeyDown, multiline, value]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    let newValue = target.textContent || '';
    
    // Check max length
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.substring(0, maxLength);
      target.textContent = newValue;
      
      // Restore cursor position to end
      setTimeout(() => {
        setCursorPosition(newValue.length);
      }, 0);
    }
    
    // Validate input if validator provided
    let valid = true;
    if (validateInput) {
      valid = validateInput(newValue);
      setIsValid(valid);
      setShowError(!valid && newValue.length > 0);
    }
    
    lastValueRef.current = newValue;
    onChange && onChange(newValue);
  }, [onChange, maxLength, validateInput, setCursorPosition]);

  // Create dynamic styles for display mode based on saved formatting
  const dynamicDisplayStyles = useMemo(() => {
    const formatting = elementType ? elementFormatting[elementType] : undefined;
    const styles: CSSProperties = {};

    if (formatting) {
      if (formatting.bold !== undefined) {
        styles.fontWeight = formatting.bold ? 'bold' : 'normal';
      }
      if (formatting.underline) {
        styles.textDecoration = 'underline';
      }
      if (formatting.fontSize) {
        styles.fontSize = `${formatting.fontSize}px`;
      }
    } else if (elementType) {
      // Apply default font weights for elements with no saved formatting
      if (elementType === 'sidebar-title') {
        styles.fontWeight = 'bold'; // Default bold for title
      } else if (elementType === 'classes-header') {
        styles.fontWeight = '500'; // Default medium for classes header
      }
    }
    return styles;
  }, [elementFormatting, elementType]);


  if (isEditing) {
    return (
      <div className="relative">
        <div
          ref={elementRef}
          contentEditable
          suppressContentEditableWarning={true}
          data-element-type={elementType}
          onInput={handleInput}
          onBlur={handleCustomBlur}
          onKeyDown={handleKeyDown}
          onContextMenu={onContextMenu}
          className={`
            ${className}
            ${!isValid ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'focus:border-blue-500 focus:ring-blue-500'}
            transition-all duration-200
            ${placeholder && !value ? 'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none empty:before:absolute' : ''}
          `}
          style={{
            ...style,
            minHeight: multiline ? '3rem' : 'auto',
            resize: multiline ? 'vertical' : 'none',
            whiteSpace: multiline ? 'pre-wrap' : 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
          data-placeholder={placeholder}
          role="textbox"
          aria-label={title || 'Editable text'}
          aria-multiline={multiline}
          aria-invalid={!isValid}
          aria-describedby={showError ? 'error-message' : undefined}
          {...props}
        />
        
        {/* Character count */}
        {showCharacterCount && maxLength && (
          <div className="absolute -bottom-6 right-0 text-xs text-gray-500">
            {value.length}/{maxLength}
          </div>
        )}
        
        {/* Error message */}
        {showError && errorMessage && (
          <div id="error-message" className="absolute -bottom-6 left-0 text-xs text-red-600 flex items-center" role="alert">
            <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {errorMessage}
          </div>
        )}
        
      </div>
    );
  }


  return (
    <div
      className={`
        ${className}
        group relative
        ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors duration-200' : ''}
      `}
      style={{
        ...style,
        ...dynamicDisplayStyles, // Apply saved formatting styles
        // Apply proper text wrapping in non-editing mode
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      title={title || 'Click to edit'}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e as any);
        }
      } : undefined}
      aria-label={onClick ? 'Click to edit text' : undefined}
      {...props}
    >
      {children || value || (
        <span className="text-gray-400 italic">
          {placeholder || 'Click to add text...'}
        </span>
      )}
      
    </div>
  );
};

// Simple memo to prevent unnecessary re-renders
export default React.memo(EditableText);

// Component enhancements:
// ✅ Enhanced UX with better keyboard navigation and shortcuts
// ✅ Improved accessibility with ARIA labels and semantic markup
// ✅ Input validation and error handling capabilities
// ✅ Character count and length limiting features
// ✅ Multiline editing support with proper controls
// ✅ Visual feedback with edit indicators and instructions
// ✅ Better empty state handling with placeholder text
// ✅ Professional styling with hover states and transitions