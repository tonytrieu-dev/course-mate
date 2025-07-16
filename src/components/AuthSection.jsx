import React, { useState, useEffect } from 'react';
import EditableText from './EditableText';

const AuthSection = ({ 
  user, 
  isAuthenticated, 
  logout, 
  onShowLogin,
  isSidebarCollapsed 
}) => {
  const [displayName, setDisplayName] = useState(() => {
    const saved = localStorage.getItem('userDisplayName');
    return saved || (user?.email?.split('@')[0] || 'User');
  });
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [displayNameSize, setDisplayNameSize] = useState(() => {
    const saved = localStorage.getItem('displayNameFontSize');
    return saved ? parseInt(saved, 10) : 14;
  });

  useEffect(() => {
    localStorage.setItem('userDisplayName', displayName);
  }, [displayName]);

  useEffect(() => {
    localStorage.setItem('displayNameFontSize', displayNameSize.toString());
  }, [displayNameSize]);

  useEffect(() => {
    if (user?.email && !localStorage.getItem('userDisplayName')) {
      setDisplayName(user.email.split('@')[0]);
    }
  }, [user]);

  if (isAuthenticated) {
    return !isSidebarCollapsed ? (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center mb-3">
          <div className="mr-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <EditableText
              value={displayName}
              onChange={setDisplayName}
              onBlur={() => setIsEditingDisplayName(false)}
              isEditing={isEditingDisplayName}
              onClick={() => setIsEditingDisplayName(true)}
              elementType="display-name"
              className={isEditingDisplayName 
                ? "text-sm font-medium text-gray-800 bg-white border border-blue-300 rounded px-1 py-0.5 w-full outline-none"
                : "text-sm font-medium text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors duration-200"
              }
              style={{ fontSize: `${displayNameSize}px` }}
              title="Click to edit display name"
            />
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="bg-white hover:bg-red-50 mt-2 text-gray-700 hover:text-red-600 py-2 px-3 rounded-lg w-full border border-gray-200 hover:border-red-200 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
        >
          Sign out
        </button>
      </div>
    ) : (
      <div className="flex flex-col items-center space-y-2">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all duration-200 overflow-hidden"
          title={user?.email}
          onClick={() => {/* This would need to be passed from parent to expand sidebar */}}
        >
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 flex items-center justify-center text-white font-semibold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
        </div>
        <button
          onClick={logout}
          className="w-10 h-8 bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-md border border-gray-200 hover:border-red-200 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md flex items-center justify-center"
          title="Sign out"
        >
          ⤴
        </button>
      </div>
    );
  }

  return !isSidebarCollapsed ? (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
      <button
        onClick={onShowLogin}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg w-full transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
      >
        Login / Register
      </button>
    </div>
  ) : (
    <div className="flex justify-center">
      <button
        onClick={onShowLogin}
        className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center justify-center"
        title="Login / Register"
      >
        👤
      </button>
    </div>
  );
};

export default AuthSection;