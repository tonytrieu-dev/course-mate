import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode,
  Dispatch,
  SetStateAction
} from 'react';

// Formatting configuration for elements
interface ElementFormatting {
  bold?: boolean;
  underline?: boolean;
  fontSize?: number;
  // Additional formatting options can be added here
}

// Element formatting storage (element type -> formatting config)
interface ElementFormattingMap {
  [elementType: string]: ElementFormatting;
}

// Formatting commands
type FormattingCommand = 'bold' | 'underline' | 'fontSize' | 'increaseFontSize' | 'decreaseFontSize';

// Font size configuration for different element types
interface FontSizeConfig {
  current: number;
  min: number;
  max: number;
  step: number;
}

// Context type definition
interface TextFormattingContextType {
  elementFormatting: ElementFormattingMap;
  setElementFormatting: Dispatch<SetStateAction<ElementFormattingMap>>;
  activeElement: HTMLElement | null;
  setActiveElement: Dispatch<SetStateAction<HTMLElement | null>>;
  restoreElementFormatting: (element: HTMLElement, elementType: string) => void;
  applyFormatting: (command: FormattingCommand, value?: string | null) => void;
  handleKeyDown: (e: KeyboardEvent) => void;
  // Font size specific methods
  increaseFontSize: (elementType: string) => void;
  decreaseFontSize: (elementType: string) => void;
  getFontSize: (elementType: string) => number;
}

// Provider props interface
interface TextFormattingProviderProps {
  children: ReactNode;
}

const TextFormattingContext = createContext<TextFormattingContextType | undefined>(undefined);

export const useTextFormatting = (): TextFormattingContextType => {
  const context = useContext(TextFormattingContext);
  if (!context) {
    throw new Error('useTextFormatting must be used within a TextFormattingProvider');
  }
  return context;
};

export const TextFormattingProvider: React.FC<TextFormattingProviderProps> = ({ children }) => {
  const [elementFormatting, setElementFormatting] = useState<ElementFormattingMap>(() => {
    try {
      const saved = localStorage.getItem('elementFormatting');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to parse elementFormatting from localStorage:', error);
      return {};
    }
  });
  
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);

  // Font size configurations for different element types
  const fontSizeConfigs: { [key: string]: FontSizeConfig } = {
    'sidebar-title': { current: 50, min: 24, max: 72, step: 2 },
    'classes-header': { current: 20, min: 14, max: 32, step: 2 },
    'class-name': { current: 14, min: 10, max: 24, step: 1 },
  };

  // Save formatting to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('elementFormatting', JSON.stringify(elementFormatting));
    } catch (error) {
      console.warn('Failed to save elementFormatting to localStorage:', error);
    }
  }, [elementFormatting]);

  const restoreElementFormatting = useCallback((element: HTMLElement, elementType: string): void => {
    if (elementType && elementFormatting[elementType]) {
      const formatting = elementFormatting[elementType];
      
      if (formatting.bold) {
        element.style.fontWeight = 'bold';
      }
      if (formatting.underline) {
        element.style.textDecoration = 'underline';
      }
      if (formatting.fontSize) {
        element.style.fontSize = `${formatting.fontSize}px`;
      }
    }
  }, [elementFormatting]);

  const applyFormatting = useCallback((command: FormattingCommand, value: string | null = null): void => {
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
      } else if (command === 'fontSize' && value) {
        // Note: execCommand is deprecated but still widely used
        // Consider using modern alternatives in future iterations
        document.execCommand('fontSize', false, value);
      }
    }
  }, [activeElement, elementFormatting]);

  // Font size methods
  const getFontSize = useCallback((elementType: string): number => {
    const formatting = elementFormatting[elementType];
    if (formatting?.fontSize) {
      return formatting.fontSize;
    }
    // Return default from config or fallback
    return fontSizeConfigs[elementType]?.current || 16;
  }, [elementFormatting, fontSizeConfigs]);

  const increaseFontSize = useCallback((elementType: string): void => {
    const config = fontSizeConfigs[elementType];
    if (!config) return;

    const currentSize = getFontSize(elementType);
    const newSize = Math.min(config.max, currentSize + config.step);
    
    if (newSize !== currentSize) {
      const currentFormatting = elementFormatting[elementType] || {};
      const newFormatting = { ...currentFormatting, fontSize: newSize };
      setElementFormatting(prev => ({ ...prev, [elementType]: newFormatting }));
      
      // Apply to active element if it matches the type
      if (activeElement && activeElement.getAttribute('data-element-type') === elementType) {
        activeElement.style.fontSize = `${newSize}px`;
      }
      
      // Also trigger custom event for components to listen to
      window.dispatchEvent(new CustomEvent('fontSizeChanged', { 
        detail: { elementType, fontSize: newSize } 
      }));
    }
  }, [elementFormatting, getFontSize, fontSizeConfigs, activeElement]);

  const decreaseFontSize = useCallback((elementType: string): void => {
    const config = fontSizeConfigs[elementType];
    if (!config) return;

    const currentSize = getFontSize(elementType);
    const newSize = Math.max(config.min, currentSize - config.step);
    
    if (newSize !== currentSize) {
      const currentFormatting = elementFormatting[elementType] || {};
      const newFormatting = { ...currentFormatting, fontSize: newSize };
      setElementFormatting(prev => ({ ...prev, [elementType]: newFormatting }));
      
      // Apply to active element if it matches the type
      if (activeElement && activeElement.getAttribute('data-element-type') === elementType) {
        activeElement.style.fontSize = `${newSize}px`;
      }
      
      // Also trigger custom event for components to listen to
      window.dispatchEvent(new CustomEvent('fontSizeChanged', { 
        detail: { elementType, fontSize: newSize } 
      }));
    }
  }, [elementFormatting, getFontSize, fontSizeConfigs, activeElement]);

  const handleKeyDown = useCallback((e: KeyboardEvent): void => {
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
        case '+':
        case '=':
          e.preventDefault();
          // Increase font size for focused element type
          if (activeElement) {
            const elementType = activeElement.getAttribute('data-element-type');
            if (elementType) {
              increaseFontSize(elementType);
            }
          }
          break;
        case '-':
        case '_':
          e.preventDefault();
          // Decrease font size for focused element type
          if (activeElement) {
            const elementType = activeElement.getAttribute('data-element-type');
            if (elementType) {
              decreaseFontSize(elementType);
            }
          }
          break;
        default:
          break;
      }
    }
  }, [applyFormatting, activeElement, increaseFontSize, decreaseFontSize]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    const handleFocus = (e: FocusEvent): void => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        setActiveElement(target);
        
        const elementType = target.getAttribute('data-element-type');
        if (elementType && elementFormatting[elementType]) {
          const formatting = elementFormatting[elementType];
          
          if (formatting.bold) {
            target.style.fontWeight = 'bold';
          }
          if (formatting.underline) {
            target.style.textDecoration = 'underline';
          }
        }
      }
    };
    
    const handleBlur = (): void => {
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

  const value: TextFormattingContextType = {
    elementFormatting,
    setElementFormatting,
    activeElement,
    setActiveElement,
    restoreElementFormatting,
    applyFormatting,
    handleKeyDown,
    increaseFontSize,
    decreaseFontSize,
    getFontSize
  };

  return (
    <TextFormattingContext.Provider value={value}>
      {children}
    </TextFormattingContext.Provider>
  );
};