import React, { useState, useEffect, MouseEvent, CSSProperties } from 'react';
import type { User } from '@supabase/supabase-js';
import EditableText from './EditableText';

// Define comprehensive interfaces for AuthSection
interface AuthSectionProps {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => Promise<boolean> | void;
  onShowLogin: () => void;
  isSidebarCollapsed: boolean;
}

// EditableText props interface (based on the component we saw)
interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  isEditing: boolean;
  onClick?: () => void;
  elementType?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

const AuthSection: React.FC<AuthSectionProps> = ({ 
  user, 
  isAuthenticated, 
  logout, 
  onShowLogin,
  isSidebarCollapsed 
}) => {
  const [displayName, setDisplayName] = useState<string>(() => {
    const saved = localStorage.getItem('userDisplayName');
    return saved || (user?.email?.split('@')[0] || 'User');
  });
  
  const [isEditingDisplayName, setIsEditingDisplayName] = useState<boolean>(false);
  
  const [displayNameSize, setDisplayNameSize] = useState<number>(() => {
    const saved = localStorage.getItem('displayNameFontSize');
    return saved ? parseInt(saved, 10) : 14;
  });

  // Save display name to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('userDisplayName', displayName);
  }, [displayName]);

  // Save display name size to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('displayNameFontSize', displayNameSize.toString());
  }, [displayNameSize]);

  // Update display name when user changes
  useEffect(() => {
    if (user?.email && !localStorage.getItem('userDisplayName')) {
      setDisplayName(user.email.split('@')[0]);
    }
  }, [user]);

  // Handler for display name editing
  const handleDisplayNameClick = (): void => {
    setIsEditingDisplayName(true);
  };

  const handleDisplayNameBlur = (): void => {
    setIsEditingDisplayName(false);
  };

  const handleDisplayNameChange = (value: string): void => {
    setDisplayName(value);
  };

  // Handler for logout button
  const handleLogoutClick = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    await logout();
  };

  // Handler for login button
  const handleLoginClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    onShowLogin();
  };

  // Handler for avatar click (placeholder for future sidebar expansion)
  const handleAvatarClick = (e: MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    // This would need to be passed from parent to expand sidebar
  };

  const handleAvatarKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // This would need to be passed from parent to expand sidebar
    }
  };

  // Get user initial for avatar
  const getUserInitial = (): string => {
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  // Generate display name style
  const displayNameStyle: CSSProperties = {
    fontSize: `${displayNameSize}px`
  };

  if (isAuthenticated && user) {
    return !isSidebarCollapsed ? (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700/50">
        <div className="flex items-center mb-3">
          <div className="mr-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                {getUserInitial()}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <EditableText
              value={displayName}
              onChange={handleDisplayNameChange}
              onBlur={handleDisplayNameBlur}
              onKeyDown={() => {}}
              isEditing={isEditingDisplayName}
              onClick={handleDisplayNameClick}
              onDoubleClick={handleDisplayNameClick}
              elementType="display-name"
              placeholder="Enter display name"
              className={isEditingDisplayName 
                ? "text-sm font-medium text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 rounded px-1 py-0.5 w-full outline-none"
                : "text-sm font-medium text-gray-800 dark:text-slate-200 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              }
              style={displayNameStyle}
              title="Click to edit display name"
            >
              {displayName}
            </EditableText>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogoutClick}
          className="bg-white dark:bg-slate-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 mt-2 text-gray-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 py-2 px-3 rounded-lg w-full border border-gray-200 dark:border-slate-700/50 hover:border-red-200 dark:hover:border-red-800/50 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          type="button"
        >
          Sign out
        </button>
      </div>
    ) : (
      <div className="flex flex-col items-center space-y-5">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all duration-200 overflow-hidden -mt-2"
          title={user.email || 'User'}
          onClick={handleAvatarClick}
          role="button"
          tabIndex={0}
          onKeyDown={handleAvatarKeyDown}
        >
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
            {getUserInitial()}
          </div>
        </div>
        <button
          onClick={handleLogoutClick}
          className="w-9 h-7 bg-white dark:bg-slate-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-md border border-gray-200 dark:border-slate-700/50 hover:border-red-200 dark:hover:border-red-800/50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center text-sm"
          title="Sign out"
          type="button"
        >
          🚪
        </button>
      </div>
    );
  }

  // Not authenticated - show login button
  return !isSidebarCollapsed ? (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/50">
      <button
        onClick={handleLoginClick}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg w-full transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
        type="button"
      >
        Login / Register
      </button>
    </div>
  ) : (
    <div className="flex justify-center">
      <button
        onClick={handleLoginClick}
        className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center justify-center"
        title="Login / Register"
        type="button"
      >
        👤
      </button>
    </div>
  );
};

export default AuthSection;