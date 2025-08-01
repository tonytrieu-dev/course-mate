import React from 'react';
import EditableText from '../EditableText';
import InlineSizeControl from '../InlineSizeControl';

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
}) => {
  return (
    <div className="pt-16">
      {!isSidebarCollapsed && (
        <div className="text-center mb-3">
          <EditableText
            value={title}
            onChange={setTitle}
            onBlur={onTitleBlur}
            isEditing={isEditingTitle}
            onClick={onTitleClick}
            onDoubleClick={() => setShowTitleSizeControl(true)}
            className={isEditingTitle 
              ? "text-4xl font-bold w-[90%] p-0.5 text-blue-700 mt-0 mb-3 font-inherit outline-none"
              : "text-blue-700 cursor-pointer leading-tight font-inherit font-semibold transition-all duration-200 hover:text-blue-800 inline-block"
            }
            style={{ fontSize: `${titleSize}px` }}
            title="Double-click to adjust size"
          />
          <InlineSizeControl 
            size={titleSize} 
            setSize={setTitleSize} 
            minSize={24} 
            maxSize={72} 
            show={showTitleSizeControl} 
            setShow={setShowTitleSizeControl} 
          />
        </div>
      )}
      {isSidebarCollapsed && (
        <div className="flex justify-center mb-3">
          <div 
            className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:bg-blue-800 transition-colors duration-200"
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