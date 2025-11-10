'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@oasis/api';
import { formatDateTime } from '@oasis/utils';

export default function AdminPage() {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('admin_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Database</span>
              <span className="text-green-600 font-medium">✓ Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Storage</span>
              <span className="text-green-600 font-medium">✓ Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Edge Functions</span>
              <span className="text-green-600 font-medium">✓ Online</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Refresh Cache
            </button>
            <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Export Data
            </button>
            <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              View Logs
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Audit Logs</h2>
        {auditLogs && auditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Time</th>
                  <th className="text-left py-2 px-4">Actor</th>
                  <th className="text-left py-2 px-4">Action</th>
                  <th className="text-left py-2 px-4">Entity</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{formatDateTime(log.created_at)}</td>
                    <td className="py-2 px-4">{log.actor || 'System'}</td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      {log.entity} {log.entity_id ? `#${log.entity_id.slice(0, 8)}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No audit logs</p>
        )}
      </div>
    </div>
  );
}

