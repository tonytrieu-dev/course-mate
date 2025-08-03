import React from 'react';
import EditableText from '../EditableText';
import InlineSizeControl from '../InlineSizeControl';

interface ColorOption {
  name: string;
  class: string;
  hoverClass: string;
}

interface SidebarTitleProps {
  title: string;
  setTitle: (title: string) => void;
  isEditingTitle: boolean;
  onTitleClick: () => void;
  onTitleBlur: () => void;
  titleSize: number;
  setTitleSize: (size: number) => void;
  showTitleSizeControl: boolean;
  setShowTitleSizeControl: (show: boolean) => void;
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
  titleSize,
  setTitleSize,
  showTitleSizeControl,
  setShowTitleSizeControl,
  isSidebarCollapsed,
  onSidebarToggle,
  titleColor,
  setTitleColor,
  showTitleColorPicker,
  setShowTitleColorPicker,
  colorOptions,
  getColorClasses,
}) => {
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
              onDoubleClick={() => setShowTitleSizeControl(true)}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowTitleColorPicker(true);
              }}
              className={isEditingTitle 
                ? `text-4xl font-bold w-[90%] p-1 ${getColorClasses(titleColor).class} mt-0 mb-3 font-inherit 
                   outline-none ring-2 ring-blue-500 ring-offset-2 rounded-md bg-white/90 backdrop-blur-sm`
                : `${getColorClasses(titleColor).class} cursor-pointer leading-tight font-inherit font-bold 
                   transition-all duration-300 ${getColorClasses(titleColor).hoverClass} inline-block
                   hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 
                   focus:ring-offset-2 rounded-md px-2 py-1 hover:shadow-lg hover:bg-white/20 backdrop-blur-sm`
              }
              style={{ fontSize: `${titleSize}px` }}
              title="Click to edit • Right-click for color"
              tabIndex={0}
              role="heading"
              aria-level={1}
              aria-label={`Application title: ${title}. Click to edit, right-click to change color.`}
            />
            
          </div>

          {/* Enhanced size control with better positioning */}
          <div className="flex justify-center mt-2">
            <InlineSizeControl 
              size={titleSize} 
              setSize={setTitleSize} 
              minSize={24} 
              maxSize={72} 
              show={showTitleSizeControl} 
              setShow={setShowTitleSizeControl} 
            />
          </div>

          {/* Enhanced Title Color Picker */}
          {showTitleColorPicker && (
            <>
              {/* Enhanced backdrop with blur effect */}
              <div 
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                onClick={() => setShowTitleColorPicker(false)}
                aria-label="Close color picker"
              />
              
              {/* Enhanced color picker modal */}
              <div className="absolute z-50 top-full mt-3 bg-white/95 backdrop-blur-lg border-2 border-gray-200 
                             rounded-xl shadow-2xl p-5 left-1/2 transform -translate-x-1/2 min-w-[240px]
                             animate-fadeIn">
                
                {/* Header with close button */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-bold text-gray-800">Choose Title Color</div>
                  <button
                    onClick={() => setShowTitleColorPicker(false)}
                    className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center 
                              transition-colors duration-200 text-gray-500 hover:text-gray-700"
                    aria-label="Close color picker"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Color grid with enhanced accessibility */}
                <div className="grid grid-cols-5 gap-3 mb-4" role="radiogroup" aria-label="Color options">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => {
                        setTitleColor(color.name);
                        setShowTitleColorPicker(false);
                      }}
                      className={`w-8 h-8 rounded-xl border-3 ${color.class.replace('text-', 'bg-')} 
                                 transition-all duration-200 transform hover:scale-110 active:scale-95
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                 shadow-md hover:shadow-lg ${
                        titleColor === color.name 
                          ? 'border-gray-800 ring-4 ring-blue-200 scale-110' 
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      title={`Select ${color.name.charAt(0).toUpperCase() + color.name.slice(1)} color`}
                      aria-label={`${color.name.charAt(0).toUpperCase() + color.name.slice(1)} color`}
                      role="radio"
                      aria-checked={titleColor === color.name}
                    >
                      {titleColor === color.name && (
                        <svg className="w-4 h-4 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowTitleColorPicker(false)}
                    className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 
                              rounded-lg transition-all duration-200 font-medium
                              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowTitleColorPicker(false)}
                    className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 
                              rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Done
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Enhanced collapsed state avatar */}
      {isSidebarCollapsed && (
        <div className="flex justify-center mb-3">
          <button 
            className={`w-12 h-12 ${getColorClasses(titleColor).class.replace('text-', 'bg-')} 
                       rounded-xl flex items-center justify-center text-white font-bold text-lg 
                       cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-95
                       ${getColorClasses(titleColor).hoverClass.replace('text-', 'bg-').replace('hover:', 'hover:')} 
                       shadow-md hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:ring-offset-2 border-2 border-white/20 hover:border-white/40
                       backdrop-blur-sm touch-manipulation`}
            onClick={onSidebarToggle}
            title={`${title} - Click to expand sidebar`}
            aria-label={`Expand sidebar. Current title: ${title}`}
            role="button"
          >
            <span className="drop-shadow-sm">{title.charAt(0).toUpperCase()}</span>
            
            {/* Expansion hint on hover */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 
                           bg-gray-900 text-white text-xs rounded-lg px-3 py-2 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                           pointer-events-none whitespace-nowrap z-50 shadow-lg">
              Click to expand
              <div className="absolute right-full top-1/2 -translate-y-1/2">
                <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 
                               border-transparent border-r-gray-900"></div>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarTitle;