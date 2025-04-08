import React, { useState } from "react";
import { fetchCanvasCalendar } from "../services/canvasService";
import { useAuth } from "../contexts/AuthContext";

const CanvasSettings = ({ onClose }) => {
    const { isAuthenticated } = useAuth();
    const [canvasUrl, setCanvasUrl] = useState("");
    const [syncStatus, setSyncStatus] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [autoSync, setAutoSync] = useState(false);

    useState(() => {
        const savedUrl = localStorage.getItem("canvas_calendar_url");
        if (savedUrl) {
            setCanvasUrl(savedUrl);
        }

        const savedAutoSync = localStorage.getItem("canvas_auto_sync");
        if (savedAutoSync) {
            setAutoSync(true);
        }
    }, []);

    const handleSyncNow = async () => {
        if (!canvasUrl) {
            setSyncStatus({
                success: false,
                message: "Please enter your Canvas calendar URL"
            });
            return;
        }

        // Save URL for future use
        localStorage.setItem("canvas_calendar_url", canvasUrl);
        localStorage.setItem("canvas_auto_sync", autoSync.toString());

        setIsSyncing(true);
        setSyncStatus({ message: "Syncing with Canvas..." });

        try {
            const result = await fetchCanvasCalendar(canvasUrl, isAuthenticated);
            setSyncStatus(result);
        } catch (error) {
            setSyncStatus({
                success: false,
                message: `Error syncing: ${error.message}`
            });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-10">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] max-w-lg relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                <h3 className="text-xl font-semibold mb-4 text-blue-600">
                    Canvas Calendar Integration
                </h3>

                <div className="mb-4">
                    <p className="text-gray-700 mb-4">
                        Enter your Canvas calendar feed URL to sync your assignments and due dates.
                        You can find this URL in Canvas under Calendar &gt; Calendar Feed.
                    </p>

                    <label className="block text-gray-700 mb-2">Canvas Calendar URL:</label>
                    <input
                        type="text"
                        value={canvasUrl}
                        onChange={(e) => setCanvasUrl(e.target.value)}
                        placeholder="https://elearn.ucr.edu/feeds/calendars/user_..."
                        className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    <div className="flex items-center mt-3">
                        <input
                            type="checkbox"
                            id="autoSync"
                            checked={autoSync}
                            onChange={(e) => setAutoSync(e.target.checked)}
                            className="mr-2"
                        />
                        <label htmlFor="autoSync" className="text-gray-700">
                            Automatically sync on startup
                        </label>
                    </div>
                </div>

                {syncStatus && (
                    <div className={`p-3 rounded mb-4 ${syncStatus.success ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {syncStatus.message}
                        {syncStatus.success && syncStatus.tasks && (
                            <p className="mt-1 text-sm">
                                {syncStatus.tasks.length} tasks imported successfully.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex justify-between mt-6">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
                    >
                        Close
                    </button>

                    <button
                        onClick={handleSyncNow}
                        disabled={isSyncing}
                        className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition ${isSyncing ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        {isSyncing ? "Syncing..." : "Sync Now"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CanvasSettings;