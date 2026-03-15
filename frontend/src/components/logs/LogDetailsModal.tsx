'use client';

import { Log } from '@/lib/types';
import SeverityBadge from '@/components/ui/SeverityBadge';

interface LogDetailsModalProps {
  log: Log | null;
  onClose: () => void;
}

export default function LogDetailsModal({ log, onClose }: LogDetailsModalProps) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold dark:text-white">Log Detail</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
            <p className="font-medium dark:text-white">{log.id}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Timestamp</p>
            <p className="font-medium dark:text-white">
              {new Date(log.timestamp).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Severity</p>
            <p className="font-medium dark:text-white">
              {log.severity && <SeverityBadge severity={log.severity} />}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Context</p>
            <p className="font-medium dark:text-white">{log.context}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Lead ID</p>
            <p className="font-medium dark:text-white">{log.leadId}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Message</p>
          <p className="p-3 bg-gray-50 dark:bg-gray-700 rounded mt-1 dark:text-gray-300">
            {log.message}
          </p>
        </div>

        {(log.FBData || log.ConversionEvent) && (
          <h3 className="font-semibold mb-2 dark:text-white">Additional Metadata</h3>
        )}

        {log.FBData && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Facebook Data
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <pre className="text-xs whitespace-pre-wrap dark:text-gray-300">
                {JSON.stringify(log.FBData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {log.ConversionEvent && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conversion Event
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <pre className="text-xs whitespace-pre-wrap dark:text-gray-300">
                {JSON.stringify(log.ConversionEvent, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
