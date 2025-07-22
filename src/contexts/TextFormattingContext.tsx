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
  // Additional formatting options can be added here
}

// Element formatting storage (element type -> formatting config)
interface ElementFormattingMap {
  [elementType: string]: ElementFormatting;
}

// Formatting commands
type FormattingCommand = 'bold' | 'underline' | 'fontSize';

// Context type definition
interface TextFormattingContextType {
  elementFormatting: ElementFormattingMap;
  setElementFormatting: Dispatch<SetStateAction<ElementFormattingMap>>;
  activeElement: HTMLElement | null;
  setActiveElement: Dispatch<SetStateAction<HTMLElement | null>>;
  restoreElementFormatting: (element: HTMLElement, elementType: string) => void;
  applyFormatting: (command: FormattingCommand, value?: string | null) => void;
  handleKeyDown: (e: KeyboardEvent) => void;
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
        default:
          break;
      }
    }
  }, [applyFormatting]);

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
    handleKeyDown
  };

  return (
    <TextFormattingContext.Provider value={value}>
      {children}
    </TextFormattingContext.Provider>
  );
};