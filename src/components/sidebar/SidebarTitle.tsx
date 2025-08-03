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
        <div className="text-center mb-3 relative">
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
              ? `text-4xl font-bold w-[90%] p-0.5 ${getColorClasses(titleColor).class} mt-0 mb-3 font-inherit outline-none`
              : `${getColorClasses(titleColor).class} cursor-pointer leading-tight font-inherit font-semibold transition-all duration-200 ${getColorClasses(titleColor).hoverClass} inline-block`
            }
            style={{ fontSize: `${titleSize}px` }}
            title="Double-click to adjust size, right-click to change color"
          />
          <InlineSizeControl 
            size={titleSize} 
            setSize={setTitleSize} 
            minSize={24} 
            maxSize={72} 
            show={showTitleSizeControl} 
            setShow={setShowTitleSizeControl} 
          />
          {/* Title Color Picker */}
          {showTitleColorPicker && (
            <div className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 left-1/2 transform -translate-x-1/2">
              <div className="grid grid-cols-5 gap-2 mb-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      setTitleColor(color.name);
                      setShowTitleColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full border-2 ${color.class.replace('text-', 'bg-')} ${
                      titleColor === color.name ? 'border-gray-800' : 'border-gray-300'
                    } hover:scale-110 transition-transform`}
                    title={color.name}
                  />
                ))}
              </div>
              <button
                onClick={() => setShowTitleColorPicker(false)}
                className="w-full text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
      {isSidebarCollapsed && (
        <div className="flex justify-center mb-3">
          <div 
            className={`w-10 h-10 ${getColorClasses(titleColor).class.replace('text-', 'bg-')} rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer ${getColorClasses(titleColor).hoverClass.replace('text-', 'bg-').replace('hover:', 'hover:')} transition-colors duration-200`}
            onClick={onSidebarToggle}
            title={title}
          >
            {title.charAt(0)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarTitle;