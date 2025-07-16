import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TextFormattingContext = createContext();

export const useTextFormatting = () => {
  const context = useContext(TextFormattingContext);
  if (!context) {
    throw new Error('useTextFormatting must be used within a TextFormattingProvider');
  }
  return context;
};

export const TextFormattingProvider = ({ children }) => {
  const [elementFormatting, setElementFormatting] = useState(() => {
    const saved = localStorage.getItem('elementFormatting');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeElement, setActiveElement] = useState(null);

  // Save formatting to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('elementFormatting', JSON.stringify(elementFormatting));
  }, [elementFormatting]);

  const restoreElementFormatting = useCallback((element, elementType) => {
    if (elementType && elementFormatting[elementType]) {
      const formatting = elementFormatting[elementType];
      
      if (formatting.bold) {
        element.style.fontWeight = 'bold';
      }
      if (formatting.underline) {
        element.style.textDecoration = 'underline';
      }
    }
  }, [elementFormatting]);

  const applyFormatting = useCallback((command, value = null) => {
    if (activeElement && activeElement.contentEditable === 'true') {
      const elementType = activeElement.getAttribute('data-element-type') || 'unknown';
      
      if (command === 'bold') {
        const currentFormatting = elementFormatting[elementType] || {};
        const newBoldState = !currentFormatting.bold;
        
        if (newBoldState) {
          activeElement.style.fontWeight = 'bold';
        } else {
          activeElement.style.fontWeight = 'normal';
        }
        
        const newFormatting = { ...currentFormatting, bold: newBoldState };
        setElementFormatting(prev => ({ ...prev, [elementType]: newFormatting }));
      } else if (command === 'underline') {
        const currentFormatting = elementFormatting[elementType] || {};
        const newUnderlineState = !currentFormatting.underline;
        
        if (newUnderlineState) {
          activeElement.style.textDecoration = 'underline';
        } else {
          activeElement.style.textDecoration = 'none';
        }
        
        const newFormatting = { ...currentFormatting, underline: newUnderlineState };
        setElementFormatting(prev => ({ ...prev, [elementType]: newFormatting }));
      } else if (command === 'fontSize') {
        document.execCommand('fontSize', false, value);
      }
    }
  }, [activeElement, elementFormatting]);

  const handleKeyDown = useCallback((e) => {
    const isCtrlPressed = e.ctrlKey || e.metaKey;
    
    if (isCtrlPressed) {
      switch (e.key) {
        case 'b':
        case 'B':
          e.preventDefault();
          applyFormatting('bold');
          break;
        case 'u':
        case 'U':
          e.preventDefault();
          applyFormatting('underline');
          break;
        default:
          break;
      }
    }
  }, [applyFormatting]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        setActiveElement(e.target);
        
        const elementType = e.target.getAttribute('data-element-type');
        if (elementType && elementFormatting[elementType]) {
          const formatting = elementFormatting[elementType];
          
          if (formatting.bold) {
            e.target.style.fontWeight = 'bold';
          }
          if (formatting.underline) {
            e.target.style.textDecoration = 'underline';
          }
        }
      }
    };
    
    const handleBlur = () => {
      setActiveElement(null);
    };
    
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [handleKeyDown, elementFormatting]);

  const value = {
    elementFormatting,
    setElementFormatting,
    activeElement,
    setActiveElement,
    restoreElementFormatting,
    applyFormatting,
    handleKeyDown
  };

  return (
    <TextFormattingContext.Provider value={value}>
      {children}
    </TextFormattingContext.Provider>
  );
};