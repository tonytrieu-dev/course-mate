import React, { useEffect, useState } from 'react';
import EditableText from '../EditableText';
import { useTextFormatting } from '../../contexts/TextFormattingContext';

interface ColorOption {
  name: string;
  class: string;
  hoverClass: string;
  bgClass: string;
  hoverBgClass: string;
}

interface SidebarTitleProps {
  title: string;
  setTitle: (title: string) => void;
  isEditingTitle: boolean;
  onTitleClick: () => void;
  onTitleBlur: () => void;
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  titleColor: string;
  setTitleColor: (color: string) => void;
  showTitleColorPicker: boolean;
  setShowTitleColorPicker: (show: boolean) => void;
  colorOptions: ColorOption[];
  getColorClasses: (colorName: string) => ColorOption;
}

const SidebarTitle: React.FC<SidebarTitleProps> = ({
  title,
  setTitle,
  isEditingTitle,
  onTitleClick,
  onTitleBlur,
  isSidebarCollapsed,
  onSidebarToggle,
  titleColor,
  setTitleColor,
  showTitleColorPicker,
  setShowTitleColorPicker,
  colorOptions,
  getColorClasses,
}) => {
  const { getFontSize } = useTextFormatting();
  const [titleSize, setTitleSize] = useState(() => getFontSize('sidebar-title'));

  // Listen for font size changes from keyboard shortcuts
  useEffect(() => {
    const handleFontSizeChange = (event: CustomEvent) => {
      if (event.detail.elementType === 'sidebar-title') {
        setTitleSize(event.detail.fontSize);
      }
    };

    window.addEventListener('fontSizeChanged', handleFontSizeChange as EventListener);
    return () => {
      window.removeEventListener('fontSizeChanged', handleFontSizeChange as EventListener);
    };
  }, []);

  // Update font size if it changes in context
  useEffect(() => {
    const currentFontSize = getFontSize('sidebar-title');
    setTitleSize(currentFontSize);
  }, [getFontSize]);
  return (
    <div className="pt-16">
      {!isSidebarCollapsed && (
        <div className="text-center mb-3 relative px-2">
          {/* Title with enhanced accessibility and interactions */}
          <div className="relative group">
            <EditableText
              value={title}
              onChange={setTitle}
              onBlur={onTitleBlur}
              isEditing={isEditingTitle}
              onClick={onTitleClick}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowTitleColorPicker(true);
              }}
              className={isEditingTitle 
                ? `text-4xl font-bold w-[90%] p-1 ${getColorClasses(titleColor).class} mt-0 mb-3 font-inherit 
                   outline-none ring-2 ring-blue-500 ring-offset-2 rounded-md bg-transparent`
                : `${getColorClasses(titleColor).class} cursor-pointer leading-tight font-inherit font-bold 
                   transition-all duration-300 ${getColorClasses(titleColor).hoverClass} inline-block
                   focus:outline-none rounded-md px-2 py-1 hover:shadow-lg hover:bg-white/20 backdrop-blur-sm`
              }
              style={{ fontSize: `${titleSize}px` }}
              title="Click to edit • Right-click for color options • Focus and use Ctrl+Plus/Minus to resize"
              tabIndex={0}
              role="heading"
              aria-level={1}
              aria-label={`Application title: ${title}. Click to edit, right-click to change color, focus and use Ctrl+Plus/Minus to resize.`}
              data-element-type="sidebar-title"
            />
            
          </div>

          {/* Ultra-Compact Title Color Picker */}
          {showTitleColorPicker && (
            <>
              {/* Enhanced backdrop */}
              <div 
                className="fixed inset-0 z-[10100] bg-black/30 dark:bg-black/50 backdrop-blur-sm"
                onClick={() => setShowTitleColorPicker(false)}
                aria-label="Close color picker"
              />
              
              {/* Ultra-compact color picker */}
              <div className="absolute z-[10101] top-full mt-2 bg-slate-800/95 backdrop-blur-lg 
                             border border-slate-600/50 rounded-lg shadow-xl p-3 
                             left-1/2 transform -translate-x-1/2 w-[140px] animate-fadeIn">
                
                {/* Minimal header */}
                <div className="text-xs font-medium text-slate-200 mb-2 text-center">Color</div>

                {/* Ultra-compact 2-row grid */}
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => {
                        setTitleColor(color.name);
                        setShowTitleColorPicker(false);
                      }}
                      className={`w-5 h-5 rounded border ${color.bgClass} 
                                 transition-all duration-150 hover:scale-110 active:scale-95
                                 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-1
                                 shadow-sm ${
                        titleColor === color.name 
                          ? 'border-slate-200 ring-1 ring-blue-400 scale-110' 
                          : 'border-slate-500 hover:border-slate-400'
                      }`}
                      title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                    >
                      {titleColor === color.name && (
                        <svg className="w-2.5 h-2.5 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                {/* Minimal close button */}
                <button
                  onClick={() => setShowTitleColorPicker(false)}
                  className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 
                            hover:text-slate-200 transition-all duration-150 py-1.5 rounded 
                            focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Enhanced collapsed state avatar with group class */}
      {isSidebarCollapsed && (
        <div className="flex justify-center mb-3">
          <button 
            className={`group w-12 h-12 ${getColorClasses(titleColor).bgClass} 
                       rounded-xl flex items-center justify-center text-white dark:text-slate-900 font-bold text-lg 
                       cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-95
                       ${getColorClasses(titleColor).hoverBgClass} 
                       shadow-md hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 
                       dark:focus:ring-blue-400 focus:ring-offset-2 border-2 border-white/20 dark:border-slate-800/20 
                       hover:border-white/40 dark:hover:border-slate-600/40 backdrop-blur-sm touch-manipulation`}
            onClick={onSidebarToggle}
            title={`${title} - Click to expand sidebar`}
            aria-label={`Expand sidebar. Current title: ${title}`}
            role="button"
          >
            <span className="drop-shadow-sm">{title.charAt(0).toUpperCase()}</span>
            
            {/* Expansion hint on hover with dark mode support */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 
                           bg-gray-900 dark:bg-slate-800 text-white dark:text-slate-200 text-xs rounded-lg px-3 py-2 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                           pointer-events-none whitespace-nowrap z-50 shadow-lg dark:shadow-slate-900/60">
              Click to expand
              <div className="absolute right-full top-1/2 -translate-y-1/2">
                <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 
                               border-transparent border-r-gray-900 dark:border-r-slate-800"></div>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarTitle;