'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchLogs } from '@/lib/api';
import { Log, LogsFilterParams } from '@/lib/types';
import LogsTable from '@/components/logs/LogsTable';
import Pagination from '@/components/logs/Pagination';
import LogDetailsModal from '@/components/logs/LogDetailsModal';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: LogsFilterParams = { page, pageSize };
      const data = await fetchLogs(filters);

      setLogs(data.logs);
      setTotalPages(Math.ceil(data.total / pageSize));
    } catch {
      setError('Failed to fetch logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (isAuthenticated) {
      loadLogs();
    }
  }, [isAuthenticated, loadLogs]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen dark:bg-gray-900">
        <div className="text-xl dark:text-white">Loading logs data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen dark:bg-gray-900">
        <div className="text-xl text-red-500 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Logs Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
        >
          Logout
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold dark:text-white">Logs ({logs.length})</h2>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <LogsTable logs={logs} onSelectLog={setSelectedLog} />
      </div>

      <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
