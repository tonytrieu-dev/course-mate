import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import SimpleCalendar from "./SimpleCalendar";
import LoginComponent from "./LoginComponent";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { initializeDefaultData } from "../services/dataService";

const CalendarApp = () => {
  const [view, setView] = useState("month");
  const [showLogin, setShowLogin] = useState(false);
  const { user, isAuthenticated, logout, syncing, triggerSync } = useAuth();

  useEffect(() => {
    // Initialize default data when the app loads
    initializeDefaultData();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isAuthenticated={isAuthenticated} />
      <div className="flex-1 p-5 bg-gray-100 overflow-auto box-border pt-16">
        {/* Header with auth controls */}
        <div className="flex justify-between items-center mb-4 relative">
          <h2 className="text-blue-600 font-bold m-0 text-xl">Calendar view</h2>
          
          <div className="flex items-center">
            {/* View controls */}
            <div className="mr-4">
              <button
                onClick={() => setView("month")}
                className={`py-1 px-2.5 mx-1 border border-gray-300 rounded ${
                  view === "month" ? "bg-blue-600 text-white" : "bg-gray-100 text-black"
                }`}
              >
                month
              </button>
              <button
                onClick={() => setView("week")}
                className={`py-1 px-2.5 mx-1 border border-gray-300 rounded ${
                  view === "week" ? "bg-blue-600 text-white" : "bg-gray-100 text-black"
                }`}
              >
                week
              </button>
              <button
                onClick={() => setView("day")}
                className={`py-1 px-2.5 mx-1 border border-gray-300 rounded ${
                  view === "day" ? "bg-blue-600 text-white" : "bg-gray-100 text-black"
                }`}
              >
                day
              </button>
            </div>
            
            {/* Auth controls */}
            <div>
              {isAuthenticated ? (
                <div className="flex items-center">
                  {syncing && (
                    <span className="text-blue-600 mr-2 animate-pulse">
                      Syncing...
                    </span>
                  )}
                  <button 
                    onClick={triggerSync}
                    disabled={syncing}
                    className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded mr-2"
                  >
                    Sync
                  </button>
                  <span className="text-gray-600 mr-2">{user?.email}</span>
                  <button 
                    onClick={logout}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLogin(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                >
                  Login / Register
                </button>
              )}
            </div>
          </div>
        </div>

        <SimpleCalendar view={view} useSupabase={isAuthenticated} />
        {showLogin && !isAuthenticated && (
          <LoginComponent onClose={() => setShowLogin(false)} />
        )}
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