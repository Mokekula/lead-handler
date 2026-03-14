"use client";
import React, { useState, useEffect, useCallback } from 'react';

// Main Dashboard Component
const LogsDashboard = () => {
    // State management
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState(process.env.NEXT_PUBLIC_PASSWORD);
    const [passwordInput, setPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(1);

    // Check authentication on component mount
    useEffect(() => {
        const storedPassword = localStorage.getItem('dashboardPassword');
        const storedTimestamp = localStorage.getItem('dashboardPasswordTimestamp');
        
        if (storedPassword && storedTimestamp) {
            const timestamp = parseInt(storedTimestamp);
            const now = new Date().getTime();
            const oneDayInMs = 24 * 60 * 60 * 1000;
            
            if (now - timestamp < oneDayInMs && storedPassword === password) {
                setIsAuthenticated(true);
                fetchLogs();
            } else {
                localStorage.removeItem('dashboardPassword');
                localStorage.removeItem('dashboardPasswordTimestamp');
            }
        }
    }, []);

    // Fetch logs from API
    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            // Build query params based on filters
            const queryParams = new URLSearchParams();
            queryParams.append('page', page.toString());
            queryParams.append('pageSize', pageSize.toString());


            const response = await fetch(`${process.env.NEXT_PUBLIC_LOGS_URL}/api/logs?${queryParams.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch logs');
            }

            const data = await response.json();
            setLogs(data.logs);
            setFilteredLogs(data.logs);
            setTotalPages(Math.ceil(data.total / pageSize));
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch logs. Please try again later.');
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchLogs();
        }
    }, [page, pageSize, isAuthenticated, fetchLogs]);

    // Handle password submission
    const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (passwordInput === password) {
            setIsAuthenticated(true);
            localStorage.setItem('dashboardPassword', passwordInput);
            localStorage.setItem('dashboardPasswordTimestamp', new Date().getTime().toString());
        } else {
            setError('Invalid password');
        }
    };

    // Handle logout
    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('dashboardPassword');
        localStorage.removeItem('dashboardPasswordTimestamp');
        setPasswordInput('');
    };

    // Pagination handlers
    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    // Log selection for detailed view
    const handleLogSelect = (log: any) => {
        setSelectedLog(log);
    };

    // Close detailed view
    const closeLogDetail = () => {
        setSelectedLog(null);
    };

    // Conditional rendering for authentication
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
                    <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Logs Dashboard</h2>
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="Enter password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>
                        {error && (
                            <div className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</div>
                        )}
                        <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) return (
        <div className="flex items-center justify-center h-screen dark:bg-gray-900">
            <div className="text-xl dark:text-white">Loading logs data...</div>
        </div>
    );

    // Error state
    if (error) return (
        <div className="flex items-center justify-center h-screen dark:bg-gray-900">
            <div className="text-xl text-red-500 dark:text-red-400">{error}</div>
        </div>
    );

    // Render the dashboard
    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Logs Dashboard</h1>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Logout
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold dark:text-white">Logs ({filteredLogs.length})</h2>
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePrevPage()}
                            disabled={page === 1}
                            className="ml-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handleNextPage()}
                            disabled={page === totalPages}
                            className="ml-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Timestamp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Message
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Lead ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Severity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Context
                            </th>
                            
                            
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {log.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate text-wrap">
                                    {log.message}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {log.leadId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${log.severity === 'DEBUG' ? 'bg-purple-100 text-purple-800' : ''}
                      ${log.severity === 'INFO' ? 'bg-green-100 text-green-800' : ''}
                      ${log.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${log.severity === 'ERROR' ? 'bg-orange-100 text-orange-800' : ''}
                      ${log.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {log.severity}
                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {log.context}
                                </td>
                                
                                
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleLogSelect(log)}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold dark:text-white">Log Detail</h2>
                            <button
                                onClick={closeLogDetail}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
                                <p className="font-medium dark:text-white">{selectedLog.id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Timestamp</p>
                                <p className="font-medium dark:text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Severity</p>
                                <p className="font-medium dark:text-white">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${selectedLog.severity === 'DEBUG' ? 'bg-purple-100 text-purple-800' : ''}
                    ${selectedLog.severity === 'INFO' ? 'bg-green-100 text-green-800' : ''}
                    ${selectedLog.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${selectedLog.severity === 'ERROR' ? 'bg-orange-100 text-orange-800' : ''}
                    ${selectedLog.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {selectedLog.severity}
                  </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Context</p>
                                <p className="font-medium dark:text-white">{selectedLog.context}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Lead ID</p>
                                <p className="font-medium dark:text-white">{selectedLog.leadId}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Message</p>
                            <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded mt-1 dark:text-gray-300">{selectedLog.message}</p>
                        </div>

                        {selectedLog.metadata && (
                            <div>
                                <h3 className="font-semibold mb-2 dark:text-white">Additional Metadata</h3>

                                {selectedLog.fbData && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facebook Data</h4>
                                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <pre className="text-xs whitespace-pre-wrap dark:text-gray-300">
                        {JSON.stringify(selectedLog.fbData, null, 2)}
                      </pre>
                                        </div>
                                    </div>
                                )}

                                {selectedLog.conversionEvent && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conversion Event</h4>
                                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <pre className="text-xs whitespace-pre-wrap dark:text-gray-300">
                        {JSON.stringify(selectedLog.conversionEvent, null, 2)}
                      </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={closeLogDetail}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogsDashboard;