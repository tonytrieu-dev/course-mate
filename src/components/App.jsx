import React, { useState, useEffect, Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

// Lazy load heavy components for better initial load performance
const Sidebar = lazy(() => import("./Sidebar"));
const SimpleCalendar = lazy(() => import("./SimpleCalendar"));
const LoginComponent = lazy(() => import("./LoginComponent"));

const CalendarApp = () => {
  const [view, setView] = useState("month");
  const { user, isAuthenticated, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <LoginComponent />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense fallback={<div className="w-64 bg-gray-800 animate-pulse"></div>}>
        <Sidebar isAuthenticated={isAuthenticated} />
      </Suspense>
      <div className="flex-1 p-5 bg-gray-100 overflow-auto box-border pt-20">
        {/* Header with auth controls */}
        <div className="flex justify-between items-center mb-4 relative">
          <div className="flex items-center">
            {/* View controls removed */}
          </div>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <SimpleCalendar view={view} useSupabase={isAuthenticated} />
        </Suspense>
      </div>
    </div>
  );
};

// Wrap the app with the AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <CalendarApp />
    </AuthProvider>
  );
};
export default App;
